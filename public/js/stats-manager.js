/**
 * stats-manager.js — D1-based blog statistics manager
 * Replaces umami-share.js + umami-stats-manager.js
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "stats-cache";
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  var MAX_CONCURRENT = 3;
  var ANIMATION_DURATION = 1000;

  // --- Cache layer ---
  var memoryCache = new Map();

  function getCacheEntry(key) {
    var entry = memoryCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.value;
    }
    if (entry) memoryCache.delete(key);

    try {
      var raw = localStorage.getItem(STORAGE_KEY + ":" + key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          memoryCache.set(key, { timestamp: parsed.timestamp, value: parsed.value });
          return parsed.value;
        }
        localStorage.removeItem(STORAGE_KEY + ":" + key);
      }
    } catch (_) {}
    return null;
  }

  function setCacheEntry(key, value) {
    var entry = { timestamp: Date.now(), value: value };
    memoryCache.set(key, entry);
    try {
      localStorage.setItem(STORAGE_KEY + ":" + key, JSON.stringify(entry));
    } catch (_) {}
  }

  // --- Concurrency control ---
  var pendingCount = 0;
  var pendingQueue = [];

  function runWithConcurrency(fn) {
    return new Promise(function (resolve, reject) {
      function run() {
        pendingCount++;
        fn()
          .then(resolve, reject)
          .finally(function () {
            pendingCount--;
            if (pendingQueue.length > 0) {
              pendingQueue.shift()();
            }
          });
      }
      if (pendingCount < MAX_CONCURRENT) {
        run();
      } else {
        pendingQueue.push(run);
      }
    });
  }

  // --- Promise deduplication ---
  var pendingRequests = new Map();

  // --- API fetch functions ---
  function fetchPostStats(path) {
    var cacheKey = "pageviews:" + path;
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    var promise = runWithConcurrency(function () {
      return fetch("/api/stats/post?path=" + encodeURIComponent(path))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var result = { views: data.views || 0 };
          setCacheEntry(cacheKey, result);
          return result;
        });
    }).catch(function (e) {
      console.warn("Stats: failed to fetch post stats for", path, e);
      return { views: 0 };
    }).finally(function () {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }

  function fetchSiteStats() {
    var cacheKey = "site:__site__";
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    var promise = runWithConcurrency(function () {
      return fetch("/api/stats/site")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var result = { views: data.views || 0, visitors: data.visitors || 0 };
          setCacheEntry(cacheKey, result);
          return result;
        });
    }).catch(function (e) {
      console.warn("Stats: failed to fetch site stats", e);
      return { views: 0, visitors: 0 };
    }).finally(function () {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }

  function recordHit(path) {
    fetch("/api/stats/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path }),
      keepalive: true,
    }).catch(function () {});
  }

  // --- Animation ---
  function animateValue(element, start, end, duration, suffix) {
    if (start === end) {
      element.textContent = end + suffix;
      return;
    }
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

  // --- DOM fill ---
  function fillElement(el, value, animate) {
    var type = el.getAttribute("data-stats-type");
    var suffix = el.getAttribute("data-stats-suffix") || "";
    var num = 0;

    if (type === "pageviews") {
      num = value.views || 0;
    } else if (type === "site-pageviews") {
      num = value.views || 0;
    } else if (type === "site-visitors") {
      num = value.visitors || 0;
    }

    // Site stats: set rawValue for SiteStats.astro animation polling
    if (el.hasAttribute("data-stats-site")) {
      el.textContent = num;
      el.dataset.rawValue = String(num);
      el.classList.add("stats-loaded");
      return;
    }

    // Per-post stats: animate
    if (animate) {
      var currentText = el.textContent.trim();
      var startVal = currentText === "--" || currentText === "" ? 0 : parseInt(currentText, 10) || 0;
      if (startVal !== num) {
        animateValue(el, startVal, num, ANIMATION_DURATION, suffix);
      } else {
        el.textContent = num + suffix;
      }
    } else {
      el.textContent = num + suffix;
    }
    el.classList.add("stats-loaded");
  }

  // --- DOM scanning ---
  function scanAndRegister() {
    var config = global.__STATS_CONFIG__;
    if (!config || !config.enable) return;

    var elements = document.querySelectorAll("[data-stats-slug], [data-stats-site]");
    if (elements.length === 0) return;

    var slugsToFetch = new Set();
    var fetchSite = false;

    elements.forEach(function (el) {
      if (el.hasAttribute("data-stats-site")) {
        var cacheKey = "site:__site__";
        var cached = getCacheEntry(cacheKey);
        if (cached) {
          fillElement(el, cached, false);
        } else {
          fetchSite = true;
        }
      } else {
        var slug = el.getAttribute("data-stats-slug");
        if (!slug) return;
        var cacheKey2 = "pageviews:" + slug;
        var cached2 = getCacheEntry(cacheKey2);
        if (cached2) {
          fillElement(el, cached2, false);
        } else {
          slugsToFetch.add(slug);
        }
      }
    });

    // Fetch missing post stats
    slugsToFetch.forEach(function (slug) {
      fetchPostStats(slug).then(function (data) {
        var els = document.querySelectorAll(
          '[data-stats-slug="' + CSS.escape(slug) + '"]'
        );
        els.forEach(function (el) {
          fillElement(el, data, true);
        });
      });
    });

    // Fetch site stats
    if (fetchSite) {
      fetchSiteStats().then(function (data) {
        document
          .querySelectorAll("[data-stats-site]")
          .forEach(function (el) {
            fillElement(el, data, true);
          });
      });
    }
  }

  // --- Track current page ---
  function trackCurrentPage() {
    var path = global.location.pathname;
    // Only record hits for actual content pages
    if (path && path !== "/") {
      recordHit(path);
    }
  }

  // --- Init ---
  var initialized = false;

  function init() {
    if (initialized) return;
    var config = global.__STATS_CONFIG__;
    if (!config || !config.enable) return;

    initialized = true;
    trackCurrentPage();
    scanAndRegister();
  }

  // Swup SPA integration
  function setupSwup() {
    if (global.swup && global.swup.hooks) {
      global.swup.hooks.on("content:replace", function () {
        scanAndRegister();
        trackCurrentPage();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
      if (global.swup) setupSwup();
      else document.addEventListener("swup:enable", setupSwup);
    });
  } else {
    init();
    if (global.swup) setupSwup();
    else document.addEventListener("swup:enable", setupSwup);
  }

  // Public API
  global.StatsManager = {
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
        keys.forEach(function (k) {
          localStorage.removeItem(k);
        });
      } catch (_) {}
    },
  };
})(window);
