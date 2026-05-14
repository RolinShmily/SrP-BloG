/**
 * Umami Stats Manager - 集中式统计管理器
 *
 * 核心设计:
 * - 双层缓存: 内存 Map (页面生命周期) + localStorage (5 分钟 TTL)
 * - 并发控制: 最多 3 个并行 API 请求
 * - IntersectionObserver: 只在元素进入视口时才发起请求
 * - 自动扫描: 通过 data-umami-slug/data-umami-type 属性发现需要填充的 DOM 元素
 *
 * 依赖: umami-share.js (需在本文件之前加载)
 */
(function (global) {
  "use strict";

  // ── 常量 ──
  var STORAGE_KEY = "umami-stats-cache";
  var CACHE_TTL = 5 * 60 * 1000; // 5 分钟
  var MAX_CONCURRENT = 3;
  var ANIMATION_DURATION = 1000;

  // ── 内存缓存 ──
  var memoryCache = new Map();

  // ── 并发控制 ──
  var pendingCount = 0;
  var pendingQueue = [];

  // ── Promise 去重: slug -> Promise ──
  var pendingRequests = new Map();

  // ── IntersectionObserver ──
  var visibilityObserver = null;

  // ── 初始化标志 ──
  var initialized = false;

  // ──────────────────────────────
  //  缓存层
  // ──────────────────────────────

  function getCacheEntry(key) {
    // 优先内存缓存
    if (memoryCache.has(key)) {
      var entry = memoryCache.get(key);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.value;
      }
      memoryCache.delete(key);
    }

    // 其次 localStorage
    try {
      var raw = localStorage.getItem(STORAGE_KEY + ":" + key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          memoryCache.set(key, parsed);
          return parsed.value;
        }
        localStorage.removeItem(STORAGE_KEY + ":" + key);
      }
    } catch (e) {
      // localStorage 不可用时静默降级
    }
    return null;
  }

  function setCacheEntry(key, value) {
    var entry = { timestamp: Date.now(), value: value };
    memoryCache.set(key, entry);
    try {
      localStorage.setItem(
        STORAGE_KEY + ":" + key,
        JSON.stringify(entry)
      );
    } catch (e) {
      // localStorage 不可用时静默降级
    }
  }

  // ──────────────────────────────
  //  并发调度
  // ──────────────────────────────

  function runWithConcurrency(fn) {
    if (pendingCount < MAX_CONCURRENT) {
      pendingCount++;
      return fn().finally(function () {
        pendingCount--;
        if (pendingQueue.length > 0) {
          var next = pendingQueue.shift();
          runWithConcurrency(next);
        }
      });
    } else {
      return new Promise(function (resolve, reject) {
        pendingQueue.push(function () {
          return fn().then(resolve, reject);
        });
      });
    }
  }

  // ──────────────────────────────
  //  API 请求 (Promise 去重)
  // ──────────────────────────────

  function fetchStatsForSlug(slug, type) {
    var cacheKey = type + ":" + slug;

    // 如果已有相同请求在飞行中，复用 Promise
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    var config = global.__UMAMI_CONFIG__;
    if (!config || !config.enable) return Promise.resolve(null);

    var promise = runWithConcurrency(function () {
      var queryParams = { timezone: config.timezone || "Asia/Shanghai" };

      if (type === "pageviews" || type === "visitors") {
        queryParams.path = "/posts/" + slug + "/";
      }
      // site-pageviews / site-visitors 不需要 path 参数

      return global.fetchUmamiStats(config.baseUrl, config.shareId, queryParams)
        .then(function (data) {
          var result = {
            pageviews: (data.pageviews && data.pageviews.value) || data.pageviews || 0,
            visitors: (data.visitors && data.visitors.value) || data.visitors || 0,
          };
          setCacheEntry(cacheKey, result);
          return result;
        })
        .catch(function (err) {
          console.warn("[UmamiStatsManager] fetch failed for", cacheKey, err);
          return null;
        })
        .finally(function () {
          pendingRequests.delete(cacheKey);
        });
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }

  // ──────────────────────────────
  //  数字动画
  // ──────────────────────────────

  function animateValue(element, start, end, duration, suffix) {
    if (!element) return;
    var startTimestamp = null;
    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      var progress = Math.min((timestamp - startTimestamp) / duration, 1);
      var current = Math.floor(progress * (end - start) + start);
      element.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = end + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // ──────────────────────────────
  //  填充 DOM 元素
  // ──────────────────────────────

  function fillElement(el, value, animate) {
    var type = el.getAttribute("data-umami-type");
    var suffix = el.getAttribute("data-umami-suffix") || "";

    if (value === null) return;

    var num = 0;
    if (type === "pageviews" || type === "site-pageviews") {
      num = value.pageviews;
    } else if (type === "visitors" || type === "site-visitors") {
      num = value.visitors;
    }

    // 侧边栏 site stats 动画由 SiteStats.astro 统一管理，这里只赋值
    if (el.hasAttribute("data-umami-site")) {
      el.textContent = num + suffix;
      el.dataset.rawValue = num;
      el.classList.add("umami-loaded");
      return;
    }

    var currentText = el.textContent.replace(/[^\d]/g, "");
    var currentVal = parseInt(currentText, 10) || 0;

    if (animate && currentVal !== num) {
      // 初次加载（"--"）从0开始动画，否则从当前值动画到目标值
      var startVal = currentText === "" ? 0 : currentVal;
      animateValue(el, startVal, num, ANIMATION_DURATION, suffix);
    } else {
      el.textContent = num + suffix;
    }

    el.classList.add("umami-loaded");
  }

  // ──────────────────────────────
  //  扫描 & 注册
  // ──────────────────────────────

  function scanAndRegister() {
    var elements = document.querySelectorAll("[data-umami-slug], [data-umami-site]");
    if (elements.length === 0) return;

    var slugsToFetch = new Set();
    var siteTypesToFetch = new Set();

    elements.forEach(function (el) {
      var slug = el.getAttribute("data-umami-slug");
      var isSite = el.hasAttribute("data-umami-site");

      if (isSite) {
        // 全站统计
        var type = el.getAttribute("data-umami-type");
        var cacheKey = type + ":__site__";
        var cached = getCacheEntry(cacheKey);

        if (cached) {
          // 有缓存直接填充
          fillElement(el, cached, false);
        } else {
          siteTypesToFetch.add(type);
          setupVisibilityFetch(el, "__site__", type);
        }
      } else if (slug) {
        // 文章页统计
        var cacheKey = null;
        var type = el.getAttribute("data-umami-type");

        // 同一 slug 的 pageviews 和 visitors 共享同一个请求
        cacheKey = type + ":" + slug;
        var cached = getCacheEntry(cacheKey);

        if (cached) {
          fillElement(el, cached, false);
        } else {
          slugsToFetch.add(slug);
          setupVisibilityFetch(el, slug, type);
        }
      }
    });

    // 为没有缓存的 slugs 发起批量请求
    slugsToFetch.forEach(function (slug) {
      fetchStatsForSlug(slug, "pageviews").then(function (data) {
        if (data) {
          document.querySelectorAll(
            '[data-umami-slug="' + slug + '"]'
          ).forEach(function (el) {
            fillElement(el, data, true);
          });
        }
      });
    });

    // 全站统计
    siteTypesToFetch.forEach(function (type) {
      fetchStatsForSlug("__site__", type).then(function (data) {
        if (data) {
          document.querySelectorAll(
            '[data-umami-site][data-umami-type="' + type + '"]'
          ).forEach(function (el) {
            fillElement(el, data, true);
          });
        }
      });
    });
  }

  // ──────────────────────────────
  //  可见性检测
  // ──────────────────────────────

  function setupVisibilityFetch(el, slug, type) {
    if (!visibilityObserver) {
      visibilityObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visibilityObserver.unobserve(entry.target);
              // 标记可见, 主 fetch 周期会处理
              entry.target.setAttribute("data-umami-visible", "true");
            }
          });
        },
        { rootMargin: "200px", threshold: 0 }
      );
    }
    visibilityObserver.observe(el);
  }

  // ──────────────────────────────
  //  初始化
  // ──────────────────────────────

  function init() {
    if (initialized) return;

    // 等待 umami-share.js 加载完成
    if (typeof global.fetchUmamiStats !== "function") {
      setTimeout(init, 50);
      return;
    }

    initialized = true;
    scanAndRegister();

    // Swup 导航时重新扫描（兼容 hooks API 和旧事件）
    function onSwupReplace() {
      scanAndRegister();
    }

    // 优先使用 swup hooks API（swup 4.x）
    if (global.swup && global.swup.hooks) {
      global.swup.hooks.on("content:replace", onSwupReplace);
    } else {
      // 兼容旧版 swup 事件
      document.addEventListener("swup:contentReplaced", onSwupReplace);
      // swup 可能还没初始化，监听 enable 事件
      document.addEventListener("swup:enable", function () {
        if (global.swup && global.swup.hooks) {
          global.swup.hooks.on("content:replace", onSwupReplace);
        }
      });
    }
  }

  // 页面加载后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ── 公开 API ──
  global.UmamiStatsManager = {
    scanAndRegister: scanAndRegister,
    clearCache: function () {
      memoryCache.clear();
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(STORAGE_KEY + ":") === 0) {
            keys.push(k);
          }
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    },
  };
})(window);
