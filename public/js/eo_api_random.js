/**
 * Static Random Pic API - 魔改重定向版
 */
(function () {
  // 1. 修改配置：直接定义你的重定向 API 基础地址
  var apiUrlBase = "https://pic.srprolin.top/pic";

  // State management: 依然保留 session 锁定逻辑，防止 Swup 跳转时背景图乱跳
  var sessionRandomH = null;
  var sessionRandomV = null;
  var sessionRandomUA = null; // 新增 UA 类型的缓存

  // Helper: 获取图片 URL。现在不再拼接数字，而是直接返回 API 地址
  function getRandomUrl(type) {
    // 逻辑：如果本 session 已经请求过某种类型，则直接返回，保证一致性
    if (type === "h") {
      if (!sessionRandomH) sessionRandomH = apiUrlBase + "?img=h";
      return sessionRandomH;
    }
    if (type === "v") {
      if (!sessionRandomV) sessionRandomV = apiUrlBase + "?img=v";
      return sessionRandomV;
    }
    if (type === "ua") {
      if (!sessionRandomUA) sessionRandomUA = apiUrlBase + "?img=ua";
      return sessionRandomUA;
    }
    return apiUrlBase + "?img=ua"; // 默认兜底
  }

  // Expose global functions (保持原版函数名)
  window.getRandomPicH = function () {
    return getRandomUrl("h");
  };
  window.getRandomPicV = function () {
    return getRandomUrl("v");
  };
  window.getRandomPicUA = function () {
    return getRandomUrl("ua");
  };

  // 1. Logic for Background
  function setRandomBackground() {
    // 背景图我们推荐使用 'ua'，让 API 自动判断 PC 还是移动端
    const bgUrl = getRandomUrl("ua");
    const bgBox = document.getElementById("bg-box");

    if (bgBox) {
      if (bgBox.classList.contains("loaded")) return; // 防止重复注入

      // 预加载逻辑：确保重定向完成后再显示，动画更平滑
      const img = new Image();
      img.onload = function () {
        bgBox.style.backgroundImage = `url('${bgUrl}')`;

        // 使用你的魔改逻辑：requestAnimationFrame 确保 transition 生效
        requestAnimationFrame(() => {
          bgBox.classList.add("loaded");
          document.documentElement.style.setProperty(
            "--card-bg",
            "var(--card-bg-transparent)"
          );
          document.documentElement.style.setProperty(
            "--float-panel-bg",
            "var(--float-panel-bg-transparent)"
          );
        });
      };
      img.src = bgUrl;
    } else {
      initGenericBackgrounds();
    }
  }

  // 2. Logic for Image Tags (移植原版逻辑)
  function initImgTags() {
    var imgTags = document.getElementsByTagName("img");
    for (var i = 0; i < imgTags.length; i++) {
      var img = imgTags[i];
      var alt = img.getAttribute("alt");
      var src = img.getAttribute("src");

      // 识别 random 占位符
      if (alt === "random:h" || (src && src.indexOf("/random/h") !== -1)) {
        img.src = getRandomUrl("h");
      } else if (
        alt === "random:v" ||
        (src && src.indexOf("/random/v") !== -1)
      ) {
        img.src = getRandomUrl("v");
      } else if (alt === "random:ua") {
        img.src = getRandomUrl("ua");
      }
    }
  }

  // Helper for generic data-random-bg (移植原版逻辑)
  function initGenericBackgrounds() {
    var bgElements = document.querySelectorAll("[data-random-bg]");
    bgElements.forEach(function (el) {
      if (el.id === "bg-box") return;
      var type = el.getAttribute("data-random-bg"); // h, v 或 ua
      var url = getRandomUrl(type);

      var img = new Image();
      img.onload = function () {
        el.style.backgroundImage = 'url("' + url + '")';
        el.classList.add("loaded");
      };
      img.src = url;
    });
  }

  function init() {
    setRandomBackground();
    initImgTags();
  }

  // --- 生命周期管理 (保持原版) ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function setupSwup() {
    if (window.swup && window.swup.hooks) {
      window.swup.hooks.on("content:replace", init);
    }
  }

  if (window.swup) setupSwup();
  else document.addEventListener("swup:enable", setupSwup);

  document.addEventListener("swup:contentReplaced", init);
})();
