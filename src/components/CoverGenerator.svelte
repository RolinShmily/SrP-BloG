<script lang="ts">
import Icon from "@iconify/svelte";
import { getHue, getStoredTheme } from "@utils/setting-utils";
import { onMount } from "svelte";

let leftText = "Text";
let rightText = "Text";
let leftTextOffset = { horizontal: 0, vertical: 0 };
let rightTextOffset = { horizontal: 0, vertical: 0 };
let iconName = "material-symbols:home-outline";
let fontSize = 64;
let iconSize = 64;
let gap = 20;

// Font state
let customFont: string | null = null;
let customFontName = "";
let fontWeight = 400;
let localFonts: {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
}[] = [];
let localFontSearchQuery = "";
let isLoadingLocalFonts = false;
let localFontError = "";

// Color state
let color = "#000000";
let bgColor = "#ffffff";
let bgColorOpacity = 1;
let iconColor = "#000000";
let useOriginalIconColor = true;

// Shadows
let textShadow = { x: 0, y: 0, blur: 0, color: "#000000", alpha: 0 };
let iconShadow = { x: 0, y: 0, blur: 0, color: "#000000", alpha: 0 };
let shadowTarget = "both";

function updateShadow(key: string, value: string | number) {
	if (shadowTarget === "both" || shadowTarget === "text") {
		textShadow = { ...textShadow, [key]: value };
	}
	if (shadowTarget === "both" || shadowTarget === "icon") {
		iconShadow = { ...iconShadow, [key]: value };
	}
}

function hexToRgba(hex: string, alpha: number) {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Theme state for UI only
let hue = 250;
let isDark = true;

// Icon Background State
let iconBgEnabled = false;
let iconBgRadius = 20;
let iconBgColor = "#000000";
let iconBgOpacity = 0.2;
let iconBgBlur = 0;
let iconBgPadding = 10;

// Icon Search
let searchQuery = "";
let searchResults: string[] = [];
let isSearching = false;
let searchDebounce: NodeJS.Timeout;

// Aspect Ratios
let ratios = [
	{ label: "1:1", w: 1, h: 1, checked: false },
	{ label: "4:3", w: 4, h: 3, checked: false },
	{ label: "16:9", w: 16, h: 9, checked: true },
	{ label: "21:9", w: 21, h: 9, checked: false },
];

// Linked scaling state
let linkScale = true;
let baseScale = 100;

let iconSvg = "";
let customIcon: string | null = null;
let svgContainer: SVGSVGElement;

// Custom icon upload
let customIconFile: string | null = null;

// Background Image State
let bgImage: string | null = null;
let bgImageX = 0;
let bgImageY = 0;
let bgImageScale = 1;
let bgBlur = 0;
let bgOpacity = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialImageX = 0;
let initialImageY = 0;
let initialPinchDistance = 0;
let initialScale = 1;

// Export Config
let exportConfig = {
	format: "png",
	scales: [1] as number[],
	filename: "cover",
	transparentBg: false,
	exportRatios: [] as string[],
};

onMount(() => {
	hue = getHue();
	const theme = getStoredTheme();
	if (theme === "auto") {
		isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	} else {
		isDark = theme === "dark";
	}

	if (isDark) {
		bgColor = "#1e1e1e";
		color = "#ffffff";
		iconColor = "#ffffff";
	}

	textShadow = { x: 0, y: 0, blur: 0, color: "#000000", alpha: 0 };
	iconShadow = { x: 0, y: 0, blur: 0, color: "#000000", alpha: 0 };
});

// Color linking state
let linkColor = true;

let lastFontSize = fontSize;
let lastIconSize = iconSize;

function handleColorChange(newColor: string, type: "text" | "icon") {
	if (type === "text") {
		color = newColor;
		if (linkColor) iconColor = newColor;
	} else {
		iconColor = newColor;
		if (linkColor) color = newColor;
	}
}

function handleFontSizeChange(e: Event) {
	const newVal = (e.target as HTMLInputElement).valueAsNumber;
	if (linkScale) {
		const ratio = newVal / lastFontSize;
		iconSize = Math.round(iconSize * ratio);
		lastIconSize = iconSize;
	}
	fontSize = newVal;
	lastFontSize = newVal;
}

function handleIconSizeChange(e: Event) {
	const newVal = (e.target as HTMLInputElement).valueAsNumber;
	if (linkScale) {
		const ratio = newVal / lastIconSize;
		fontSize = Math.round(fontSize * ratio);
		lastFontSize = fontSize;
	}
	iconSize = newVal;
	lastIconSize = newVal;
}

function handleBgImageUpload(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			bgImage = e.target?.result as string;
			bgImageX = 0;
			bgImageY = 0;
			bgImageScale = 1;
			bgBlur = 0;
			bgOpacity = 1;
		};
		reader.readAsDataURL(file);
	}
}

function handleIconUpload(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			customIconFile = e.target?.result as string;
			customIcon = e.target?.result as string;
			iconName = "";
		};
		reader.readAsDataURL(file);
	}
}

function handleFontUpload(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const fontData = e.target?.result as string;
			customFontName = file.name.replace(/\.[^/.]+$/, "");
			customFont = fontData;
			const fontFace = new FontFace(customFontName, fontData);
			fontFace.load().then((loadedFace) => {
				document.fonts.add(loadedFace);
			});
		};
		reader.readAsArrayBuffer(file);
	}
}

async function loadLocalFonts() {
	if (!("queryLocalFonts" in window)) {
		localFontError = "仅支持 PC端新版Chrome/Edge等Chromium内核的浏览器";
		return;
	}
	isLoadingLocalFonts = true;
	localFontError = "";
	try {
		const fonts = await (window as any).queryLocalFonts();
		localFonts = fonts.map((f: any) => ({
			family: f.family,
			fullName: f.fullName,
			postscriptName: f.postscriptName,
			style: f.style,
		}));
	} catch (e: any) {
		if (e.name === "NotAllowedError") {
			localFontError = "您拒绝了字体访问权限";
		} else {
			localFontError = "加载本地字体失败: " + e.message;
		}
	} finally {
		isLoadingLocalFonts = false;
	}
}

function selectLocalFont(font: {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
}) {
	customFontName = font.family;
	customFont = null;
	localFonts = [];
	localFontSearchQuery = "";
}

$: filteredLocalFonts = localFonts.filter(
	(f) =>
		f.family.toLowerCase().includes(localFontSearchQuery.toLowerCase()) ||
		f.fullName.toLowerCase().includes(localFontSearchQuery.toLowerCase()),
);

let activePointers = new Map<number, { x: number; y: number }>();

function handlePointerDown(e: PointerEvent) {
	if (!bgImage) return;
	e.preventDefault();
	(e.currentTarget as Element).setPointerCapture(e.pointerId);
	activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

	if (activePointers.size === 1) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		initialImageX = bgImageX;
		initialImageY = bgImageY;
	} else if (activePointers.size === 2) {
		isDragging = false;
		const points = Array.from(activePointers.values());
		initialPinchDistance = Math.hypot(
			points[1].x - points[0].x,
			points[1].y - points[0].y,
		);
		initialScale = bgImageScale;
	}
}

function handlePointerMove(e: PointerEvent) {
	if (!bgImage || !activePointers.has(e.pointerId)) return;
	e.preventDefault();
	activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

	if (activePointers.size === 2) {
		const points = Array.from(activePointers.values());
		const currentDistance = Math.hypot(
			points[1].x - points[0].x,
			points[1].y - points[0].y,
		);

		if (initialPinchDistance > 0) {
			const scaleFactor = currentDistance / initialPinchDistance;
			bgImageScale = Math.max(0.1, Math.min(initialScale * scaleFactor, 10));
		}
	} else if (activePointers.size === 1 && isDragging) {
		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;
		bgImageX = initialImageX + deltaX / bgImageScale;
		bgImageY = initialImageY + deltaY / bgImageScale;
	}
}

function handlePointerUp(e: PointerEvent) {
	activePointers.delete(e.pointerId);
	(e.currentTarget as Element).releasePointerCapture(e.pointerId);

	if (activePointers.size < 2) {
		initialPinchDistance = 0;
	}
	if (activePointers.size === 0) {
		isDragging = false;
	}
}

function handleWheel(e: WheelEvent) {
	if (!bgImage) return;
	e.preventDefault();
	const scaleFactor = 1.1;

	if (e.deltaY < 0) {
		bgImageScale = Math.min(bgImageScale * scaleFactor, 10);
	} else {
		bgImageScale = Math.max(bgImageScale / scaleFactor, 0.1);
	}
}

const BASE_HEIGHT = 900;

$: activeRatios = ratios.filter((r) => r.checked);
$: visualRatios = activeRatios.length > 0 ? activeRatios : [ratios[2]];

$: maxWidthRatio = visualRatios.reduce(
	(max, r) => (r.w / r.h > max ? r.w / r.h : max),
	0,
);
$: canvasWidth = Math.round(BASE_HEIGHT * maxWidthRatio);
$: canvasHeight = BASE_HEIGHT;

$: {
	if (customIconFile) {
		iconSvg = `<img src="${customIconFile}" style="width: 100%; height: 100%; object-fit: contain;" />`;
	} else if (iconName?.includes(":")) {
		const [prefix, name] = iconName.split(":");
		fetch(`https://api.iconify.design/${prefix}/${name}.svg`)
			.then((res) => {
				if (!res.ok) throw new Error("Icon not found");
				return res.text();
			})
			.then((svg) => {
				let processedSvg = svg
					.replace(/width="[^"]*"/g, "")
					.replace(/height="[^"]*"/g, "");

				if (!useOriginalIconColor) {
					processedSvg = processedSvg.replace(
						/fill="[^"]*"/g,
						'fill="currentColor"',
					);
				}

				iconSvg = processedSvg;
			})
			.catch(() => {
				iconSvg = "";
			});
	} else {
		iconSvg = "";
	}
}

async function handleSearch() {
	if (!searchQuery) {
		searchResults = [];
		return;
	}
	isSearching = true;
	try {
		const res = await fetch(
			`https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=20`,
		);
		const data = await res.json();
		searchResults = data.icons || [];
	} catch (e) {
		console.error(e);
		searchResults = [];
	} finally {
		isSearching = false;
	}
}

function onSearchInput(e: Event) {
	const val = (e.target as HTMLInputElement).value;
	searchQuery = val;

	clearTimeout(searchDebounce);
	if (val.trim()) {
		searchDebounce = setTimeout(() => {
			handleSearch();
		}, 500);
	} else {
		searchResults = [];
	}
}

function selectIcon(icon: string) {
	iconName = icon;
	customIconFile = null;
	searchResults = [];
	searchQuery = "";
}

async function doExport() {
	if (!svgContainer) return;

	const guides = svgContainer.querySelectorAll(".ratio-guide");
	for (const g of guides) {
		(g as SVGElement).style.display = "none";
	}

	const border = svgContainer.querySelector(".canvas-border");
	if (border) (border as SVGElement).style.display = "none";

	const svgClone = svgContainer.cloneNode(true) as SVGSVGElement;

	const defs = svgClone.querySelector("defs");
	if (defs) {
		const pattern = defs.querySelector("#checkerboard");
		if (pattern) pattern.remove();
	}

	const fo = svgClone.querySelector("foreignObject");
	if (fo) {
		fo.setAttribute("width", canvasWidth.toString());
		fo.setAttribute("height", canvasHeight.toString());
	}

	const bgImg = svgClone.querySelector("image");
	if (bgImg) {
		bgImg.setAttribute("width", canvasWidth.toString());
		bgImg.setAttribute("height", canvasHeight.toString());
		bgImg.style.filter = `blur(${bgBlur}px)`;
		bgImg.style.opacity = bgOpacity.toString();
	}
	const checkerboardRect = svgClone.querySelector("rect");
	if (checkerboardRect) checkerboardRect.remove();

	const bgRects = svgClone.querySelectorAll("rect");
	const solidBgRect = bgRects[1];
	if (solidBgRect) {
		solidBgRect.setAttribute("width", canvasWidth.toString());
		solidBgRect.setAttribute("height", canvasHeight.toString());

		if (exportConfig.transparentBg) {
			solidBgRect.setAttribute("fill", "none");
		} else {
			solidBgRect.setAttribute("fill", hexToRgba(bgColor, bgColorOpacity));
		}
	}

	const ratiosToExport =
		exportConfig.exportRatios.length > 0
			? ratios.filter((r) => exportConfig.exportRatios.includes(r.label))
			: activeRatios;

	for (const ratio of ratiosToExport) {
		const ratioWidth = Math.round(BASE_HEIGHT * (ratio.w / ratio.h));
		const ratioHeight = BASE_HEIGHT;

		const xOffset = (canvasWidth - ratioWidth) / 2;

		const ratioSvgClone = svgClone.cloneNode(true) as SVGSVGElement;
		ratioSvgClone.setAttribute("width", ratioWidth.toString());
		ratioSvgClone.setAttribute("height", ratioHeight.toString());
		ratioSvgClone.setAttribute(
			"viewBox",
			`${xOffset} 0 ${ratioWidth} ${ratioHeight}`,
		);

		const svgData = new XMLSerializer().serializeToString(ratioSvgClone);

		const ratioFilename =
			activeRatios.length > 1
				? `${exportConfig.filename}-${ratio.label.replace(":", "-")}`
				: exportConfig.filename;

		if (exportConfig.format === "svg") {
			const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			downloadLink(url, `${ratioFilename}.svg`);
		} else {
			const img = new Image();
			img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

			await new Promise<void>((resolve) => {
				img.onload = () => resolve();
			});

			const scales = exportConfig.scales.length > 0 ? exportConfig.scales : [1];

			for (const scale of scales) {
				const canvas = document.createElement("canvas");
				canvas.width = ratioWidth * scale;
				canvas.height = ratioHeight * scale;
				const ctx = canvas.getContext("2d");
				if (!ctx) continue;

				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";

				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				const suffix = scales.length > 1 ? `@${scale}x` : "";
				downloadLink(
					canvas.toDataURL("image/png"),
					`${ratioFilename}${suffix}.png`,
				);
			}
		}
	}

	for (const g of guides) {
		(g as SVGElement).style.display = "";
	}
	if (border) (border as SVGElement).style.display = "";
}

function downloadLink(url: string, filename: string) {
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
</script>

<div class="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto relative">
  <!-- Preview Area -->
  <div
      class="w-full overflow-hidden flex justify-center bg-[var(--card-bg)] p-4 rounded-xl select-none transition-colors duration-300 touch-none"
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointercancel={handlePointerUp}
      on:pointerleave={handlePointerUp}
  >
      <svg
        bind:this={svgContainer}
        width={canvasWidth}
        height={canvasHeight}
        viewBox="0 0 {canvasWidth} {canvasHeight}"
        xmlns="http://www.w3.org/2000/svg"
        style="max-width: 100%; height: auto; cursor: {bgImage ? (isDragging ? 'grabbing' : 'grab') : 'default'};"
        on:wheel={handleWheel}
      >
        <defs>
            <pattern id="checkerboard" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#e0e0e0" />
                <rect x="10" y="0" width="10" height="10" fill="#ffffff" />
                <rect x="0" y="10" width="10" height="10" fill="#ffffff" />
                <rect x="10" y="10" width="10" height="10" fill="#e0e0e0" />
            </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#checkerboard)" />
        <rect width="100%" height="100%" fill={hexToRgba(bgColor, bgColorOpacity)} />

        {#if bgImage}
            <image
                href={bgImage}
                x={bgImageX}
                y={bgImageY}
                width={canvasWidth}
                height={canvasHeight}
                transform="scale({bgImageScale})"
                style="transform-origin: 50% 50%; filter: blur({bgBlur}px); opacity: {bgOpacity};"
                preserveAspectRatio="xMidYMid meet"
            />
        {/if}

        <foreignObject x="0" y="0" width="100%" height="100%" style="pointer-events: none;">
<div
                xmlns="http://www.w3.org/1999/xhtml"
                style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: {gap}px;
                    font-family: {customFontName || 'sans-serif'};
                    font-weight: {fontWeight};
                "
            >
                <span style="
                    font-size: {fontSize}px;
                    color: {color};
                    text-shadow: {textShadow.x}px {textShadow.y}px {textShadow.blur}px {hexToRgba(textShadow.color, textShadow.alpha)};
                    line-height: 1;
                    white-space: nowrap;
                    transform: translate({leftTextOffset.horizontal}px, {leftTextOffset.vertical}px);
                ">{leftText}</span>

                {#if iconSvg}
                    <div style="
                        width: {iconSize + iconBgPadding * 2}px;
                        height: {iconSize + iconBgPadding * 2}px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: {iconBgEnabled ? hexToRgba(iconBgColor, iconBgOpacity) : 'transparent'};
                        backdrop-filter: {iconBgEnabled && iconBgBlur > 0 ? `blur(${iconBgBlur}px)` : 'none'};
                        -webkit-backdrop-filter: {iconBgEnabled && iconBgBlur > 0 ? `blur(${iconBgBlur}px)` : 'none'};
                        border-radius: {iconBgEnabled ? `${iconBgRadius}%` : '0'};
                    ">
                        <div style="
                            width: {iconSize}px;
                            height: {iconSize}px;
                            color: {useOriginalIconColor ? 'inherit' : iconColor};
                            filter: drop-shadow({iconShadow.x}px {iconShadow.y}px {iconShadow.blur}px {hexToRgba(iconShadow.color, iconShadow.alpha)});
                            display: flex;
                        ">
                            {@html iconSvg}
                        </div>
                    </div>
                {/if}

                <span style="
                    font-size: {fontSize}px;
                    color: {color};
                    text-shadow: {textShadow.x}px {textShadow.y}px {textShadow.blur}px {hexToRgba(textShadow.color, textShadow.alpha)};
                    line-height: 1;
                    white-space: nowrap;
                    transform: translate({rightTextOffset.horizontal}px, {rightTextOffset.vertical}px);
                ">{rightText}</span>
            </div>
        </foreignObject>

        <rect
            x="0"
            y="0"
            width={canvasWidth}
            height={canvasHeight}
            fill="none"
            stroke="rgba(255, 0, 0, 0.8)"
            stroke-width="2"
            class="canvas-border"
        />

        {#each visualRatios as ratio}
            {#if (BASE_HEIGHT * (ratio.w / ratio.h)) < canvasWidth}
                <g class="ratio-guide">
                    <rect
                        x={(canvasWidth - (BASE_HEIGHT * (ratio.w / ratio.h))) / 2}
                        y="0"
                        width={BASE_HEIGHT * (ratio.w / ratio.h)}
                        height={BASE_HEIGHT}
                        fill="none"
                        stroke="rgba(255, 0, 0, 0.5)"
                        stroke-width="2"
                        stroke-dasharray="10 5"
                    />
                    <text
                        x="{(canvasWidth - (BASE_HEIGHT * (ratio.w / ratio.h))) / 2 + 10}"
                        y="30"
                        fill="rgba(255, 0, 0, 0.5)"
                        font-size="20"
                    >{ratio.label}</text>
                </g>
            {/if}
        {/each}
      </svg>
  </div>

  <!-- Controls -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full bg-[var(--card-bg)] p-6 rounded-xl transition-colors duration-300" style="--hue: {hue}">

    <!-- Left Column: Content -->
    <div class="flex flex-col gap-6">
      <h3 class="text-lg font-bold text-[var(--primary)] flex items-center gap-2">
          <Icon icon="material-symbols:edit-outline" class="w-5 h-5" />
          内容设置
      </h3>

      <div class="space-y-4">
          <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300">背景图片</label>
              <div class="relative">
                  <input type="file" accept="image/*" on:change={handleBgImageUpload} class="hidden" id="bg-upload" />
                  <label for="bg-upload" class="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all group">
                      <div class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 group-hover:text-[var(--primary)]">
                          <Icon icon="material-symbols:upload-file" class="w-6 h-6" />
                          <span class="text-xs">{bgImage ? '点击更换图片' : '点击上传背景图'}</span>
                      </div>
                  </label>
                  {#if bgImage}
                      <button
                          on:click={() => { bgImage = null; bgImageScale = 1; bgImageX = 0; bgImageY = 0; }}
                          class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                          title="移除背景图"
                      >
                          <Icon icon="material-symbols:close" class="w-3 h-3" />
                      </button>
                      <div class="mt-2 space-y-1" on:click|stopPropagation>
                          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <label>模糊程度</label>
                              <span>{bgBlur}px</span>
                          </div>
                          <input type="range" bind:value={bgBlur} min="0" max="20" class="range-slider h-1" />
                      </div>
                      <div class="mt-2 space-y-1" on:click|stopPropagation>
                          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <label>不透明度</label>
                              <span>{Math.round(bgOpacity * 100)}%</span>
                          </div>
                          <input type="range" bind:value={bgOpacity} min="0" max="1" step="0.01" class="range-slider h-1" />
                      </div>
                      <p class="text-[10px] text-gray-400 mt-1 text-center">
                          提示: 拖拽移动位置，滚轮缩放大小
                      </p>
                  {/if}
              </div>
          </div>

<div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">左侧文字</label>
                <input type="text" bind:value={leftText} class="input-field w-full" />
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">右侧文字</label>
                <input type="text" bind:value={rightText} class="input-field w-full" />
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">自定义字体</label>
                <div class="relative">
                    <input type="file" accept=".ttf,.otf,.woff,.woff2" on:change={handleFontUpload} class="hidden" id="font-upload" />
                    <label for="font-upload" class="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all group">
                        <div class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 group-hover:text-[var(--primary)]">
                            <Icon icon="material-symbols:font-download" class="w-5 h-5" />
                            <span class="text-xs">{customFontName ? customFontName : '点击上传字体'}</span>
                        </div>
                    </label>
                    {#if customFontName}
                        <button
                            on:click={() => { customFont = null; customFontName = ""; }}
                            class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                            title="移除字体"
                        >
                            <Icon icon="material-symbols:close" class="w-3 h-3" />
                        </button>
                    {/if}
                </div>
                <div class="flex gap-2 mt-1">
                    <button
                        on:click={loadLocalFonts}
                        disabled={isLoadingLocalFonts}
                        class="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs border border-[var(--line-color)] rounded hover:bg-[var(--btn-regular-bg)] transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                        {#if isLoadingLocalFonts}
                            <Icon icon="line-md:loading-twotone-loop" class="w-4 h-4" />
                        {:else}
                            <Icon icon="material-symbols:computer" class="w-4 h-4" />
                        {/if}
                        <span>读取本地字体</span>
                    </button>
                </div>
                {#if localFontError}
                    <p class="text-xs text-red-500">{localFontError}</p>
                {/if}
                {#if localFonts.length > 0}
                    <div class="space-y-2 mt-2 p-2 border border-[var(--line-color)] rounded-lg">
                        <input
                            type="text"
                            bind:value={localFontSearchQuery}
                            placeholder="搜索字体..."
                            class="input-field w-full text-xs !py-1"
                        />
                        <div class="max-h-40 overflow-y-auto space-y-1">
                            {#each filteredLocalFonts as font (font.postscriptName)}
                                <button
                                    on:click={() => selectLocalFont(font)}
                                    class="w-full text-left px-2 py-1 text-xs hover:bg-[var(--btn-regular-bg)] rounded transition-colors text-gray-700 dark:text-gray-300"
                                    style="font-family: '{font.family}'"
                                >
                                    <span class="font-medium">{font.family}</span>
                                    <span class="text-gray-400 ml-1">{font.style}</span>
                                </button>
                            {/each}
                        </div>
                        <button
                            on:click={() => { localFonts = []; localFontSearchQuery = ""; }}
                            class="w-full text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                {/if}
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm"><label class="text-gray-700 dark:text-gray-300 font-bold">字体粗细</label> <span class="text-gray-500 dark:text-gray-400 font-mono">{fontWeight}</span></div>
                <input type="range" bind:value={fontWeight} min="100" max="900" step="100" class="range-slider" />
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">图标搜索</label>
                <div class="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        on:input={onSearchInput}
                        placeholder="输入关键词自动搜索..."
                        class="input-field w-full"
                    />
                    {#if isSearching}
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Icon icon="line-md:loading-twotone-loop" class="w-5 h-5" />
                        </div>
                    {/if}
                </div>

                {#if searchResults.length > 0}
                    <div class="grid grid-cols-5 gap-2 mt-2 max-h-40 overflow-y-auto p-2 bg-transparent rounded-lg border border-[var(--line-color)]">
                        {#each searchResults as icon}
                            <button
                                on:click={() => selectIcon(icon)}
                                class="p-2 hover:bg-[var(--btn-regular-bg)] rounded flex flex-col items-center gap-1 group transition-colors aspect-square justify-center text-gray-700 dark:text-gray-300"
                                title={icon}
                            >
                                <img src={`https://api.iconify.design/${icon.split(':')[0]}/${icon.split(':')[1]}.svg`} class="w-6 h-6" alt={icon} />
                            </button>
                        {/each}
                    </div>
                {/if}
                <div class="flex flex-wrap justify-between items-center text-xs mt-1 gap-2">
                    <span class="text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={iconName}>当前: {iconName || customIconFile ? '自定义图标' : '无'}</span>
                    <button on:click={() => window.open('https://icones.js.org/', '_blank')} class="text-[var(--primary)] hover:underline whitespace-nowrap">
                        浏览图标库 ↗
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">上传图标</label>
                <div class="relative">
                    <input type="file" accept="image/*,.svg" on:change={handleIconUpload} class="hidden" id="icon-upload" />
                    <label for="icon-upload" class="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all group">
                        <div class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 group-hover:text-[var(--primary)]">
                            <Icon icon="material-symbols:upload-file" class="w-6 h-6" />
                            <span class="text-xs">{customIconFile ? '点击更换图标' : '点击上传图标'}</span>
                        </div>
                    </label>
                    {#if customIconFile}
                        <button
                            on:click={() => { customIconFile = null; iconName = "material-symbols:home-outline"; }}
                            class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                            title="移除图标"
                        >
                            <Icon icon="material-symbols:close" class="w-3 h-3" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Middle Column: Style -->
    <div class="flex flex-col gap-6">
        <h3 class="text-lg font-bold text-[var(--primary)] flex items-center gap-2 justify-between">
            <div class="flex items-center gap-2">
                <Icon icon="material-symbols:palette-outline" class="w-5 h-5" />
                样式设置
            </div>
            <label class="flex items-center gap-2 text-xs font-normal cursor-pointer select-none bg-transparent border border-[var(--line-color)] px-2 py-1 rounded hover:bg-[var(--btn-regular-bg)] transition-colors text-gray-700 dark:text-gray-300">
                <input type="checkbox" bind:checked={linkScale} class="accent-[var(--primary)]" />
                等比缩放
            </label>
        </h3>

        <div class="space-y-6">
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm"><label class="text-gray-700 dark:text-gray-300 font-bold">字体大小</label> <span class="text-gray-500 dark:text-gray-400 font-mono">{fontSize}px</span></div>
                <input type="range" value={fontSize} on:input={handleFontSizeChange} min="20" max="700" class="range-slider" />
            </div>
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm"><label class="text-gray-700 dark:text-gray-300 font-bold">图标大小</label> <span class="text-gray-500 dark:text-gray-400 font-mono">{iconSize}px</span></div>
                <input type="range" value={iconSize} on:input={handleIconSizeChange} min="20" max="700" class="range-slider" />
            </div>
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm"><label class="text-gray-700 dark:text-gray-300 font-bold">间距</label> <span class="text-gray-500 dark:text-gray-400 font-mono">{gap}px</span></div>
                <input type="range" bind:value={gap} min="0" max="200" class="range-slider" />
            </div>
        </div>

        <!-- Text Position Controls -->
        <div class="space-y-4">
            <div class="bg-transparent rounded-lg p-3 space-y-3 border border-[var(--line-color)]">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">左侧文字位置</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <label>水平移动</label>
                            <span>{leftTextOffset.horizontal}px</span>
                        </div>
                        <input type="range" bind:value={leftTextOffset.horizontal} min="-100" max="100" class="range-slider h-1" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <label>垂直移动</label>
                            <span>{leftTextOffset.vertical}px</span>
                        </div>
                        <input type="range" bind:value={leftTextOffset.vertical} min="-100" max="100" class="range-slider h-1" />
                    </div>
                </div>
            </div>

            <div class="bg-transparent rounded-lg p-3 space-y-3 border border-[var(--line-color)]">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">右侧文字位置</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <label>水平移动</label>
                            <span>{rightTextOffset.horizontal}px</span>
                        </div>
                        <input type="range" bind:value={rightTextOffset.horizontal} min="-100" max="100" class="range-slider h-1" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <label>垂直移动</label>
                            <span>{rightTextOffset.vertical}px</span>
                        </div>
                        <input type="range" bind:value={rightTextOffset.vertical} min="-100" max="100" class="range-slider h-1" />
                    </div>
                </div>
            </div>
        </div>

        <div class="w-full h-px bg-gray-200 dark:bg-gray-700"></div>

        <div class="space-y-4">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label class="flex items-center gap-2 text-xs font-normal cursor-pointer select-none bg-transparent border border-[var(--line-color)] px-2 py-1 rounded hover:bg-[var(--btn-regular-bg)] transition-colors text-gray-700 dark:text-gray-300">
                    <input type="checkbox" bind:checked={linkColor} class="accent-[var(--primary)]" />
                    颜色同步
                </label>
                <label class="flex items-center gap-2 text-xs font-normal cursor-pointer select-none bg-transparent border border-[var(--line-color)] px-2 py-1 rounded hover:bg-[var(--btn-regular-bg)] transition-colors text-gray-700 dark:text-gray-300">
                    <input type="checkbox" bind:checked={useOriginalIconColor} class="accent-[var(--primary)]" />
                    原色图标
                </label>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[4rem]">文字颜色</label>
                <div class="flex items-center gap-2">
                    <input type="text" value={color} on:input={(e) => handleColorChange((e.target as HTMLInputElement).value, 'text')} class="input-field text-xs !p-1 !h-8 w-24 font-mono text-center" />
                    <div class="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
                        <input type="color" value={color} on:input={(e) => handleColorChange((e.target as HTMLInputElement).value, 'text')} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[4rem]">图标颜色</label>
                <div class="flex items-center gap-2">
                    <input type="text" value={iconColor} disabled={useOriginalIconColor} on:input={(e) => handleColorChange((e.target as HTMLInputElement).value, 'icon')} class="input-field text-xs !p-1 !h-8 w-24 font-mono text-center disabled:opacity-50" />
                    <div class="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm shrink-0 {useOriginalIconColor ? 'opacity-50 pointer-events-none' : ''}">
                        <input type="color" value={iconColor} on:input={(e) => handleColorChange((e.target as HTMLInputElement).value, 'icon')} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[4rem]">背景颜色</label>
                <div class="flex items-center gap-2">
                    <div class="flex flex-col items-end gap-1">
                        <div class="flex items-center gap-2">
                            <input type="text" bind:value={bgColor} class="input-field text-xs !p-1 !h-8 w-24 font-mono text-center" />
                            <div class="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
                                <input type="color" bind:value={bgColor} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer" />
                            </div>
                        </div>
                        <div class="flex items-center gap-2 w-full justify-end">
                            <span class="text-[10px] text-gray-500">不透明度 {Math.round(bgColorOpacity * 100)}%</span>
                            <input type="range" bind:value={bgColorOpacity} min="0" max="1" step="0.01" class="range-slider w-16 h-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Column: Effects & Export -->
    <div class="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
        <h3 class="text-lg font-bold text-[var(--primary)] flex items-center gap-2">
            <Icon icon="material-symbols:auto-fix" class="w-5 h-5" />
            特效与导出
        </h3>

        <!-- Icon Background -->
        <div class="bg-transparent rounded-lg p-4 space-y-4 border border-[var(--line-color)]">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">图标背景</h4>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={iconBgEnabled} class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--primary)]"></div>
                </label>
            </div>

            {#if iconBgEnabled}
                <div class="space-y-3 pt-2 border-t border-[var(--line-color)]">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <label class="text-xs text-gray-500 dark:text-gray-400">背景颜色</label>
                        <div class="flex items-center gap-2">
                            <input type="text" bind:value={iconBgColor} class="input-field text-xs !p-1 !h-6 w-20 font-mono" />
                            <div class="relative w-6 h-6 rounded-full overflow-hidden border border-[var(--line-color)] shadow-sm shrink-0">
                                <input type="color" bind:value={iconBgColor} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <label>内边距</label>
                                <span>{iconBgPadding}px</span>
                            </div>
                            <input type="range" bind:value={iconBgPadding} min="0" max="100" class="range-slider h-1" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <label>圆角半径</label>
                                <span>{iconBgRadius}%</span>
                            </div>
                            <input type="range" bind:value={iconBgRadius} min="0" max="50" class="range-slider h-1" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <label>模糊</label>
                                <span>{iconBgBlur}px</span>
                            </div>
                            <input type="range" bind:value={iconBgBlur} min="0" max="20" class="range-slider h-1" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                <label>不透明度</label>
                                <span>{Math.round(iconBgOpacity * 100)}%</span>
                            </div>
                            <input type="range" bind:value={iconBgOpacity} min="0" max="1" step="0.01" class="range-slider h-1" />
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Shadows -->
        <div class="bg-transparent rounded-lg p-4 space-y-4 border border-[var(--line-color)]">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300">阴影设置</span>
                <div class="flex bg-transparent rounded-lg p-1 border border-[var(--line-color)]">
                    {#each [
                        { id: 'both', icon: 'material-symbols:layers', label: '全部' },
                        { id: 'text', icon: 'material-symbols:title', label: '文字' },
                        { id: 'icon', icon: 'material-symbols:star', label: '图标' }
                    ] as target}
                        <button
                            class="p-1.5 rounded transition-all {shadowTarget === target.id ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-500 hover:text-[var(--primary)] bg-transparent'}"
                            on:click={() => shadowTarget = target.id}
                            title={target.label}
                        >
                            <Icon icon={target.icon} class="w-4 h-4" />
                        </button>
                    {/each}
                </div>
            </div>

            <div class="text-sm font-bold flex items-center justify-between flex-wrap gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-xs text-gray-500 font-normal">颜色 ({shadowTarget === 'both' ? '统一' : (shadowTarget === 'text' ? '仅文字' : '仅图标')})</span>
                <div class="flex items-center gap-2">
                    <input type="text" value={shadowTarget === 'icon' ? iconShadow.color : textShadow.color} on:input={(e) => updateShadow('color', (e.target as HTMLInputElement).value)} class="input-field text-xs !p-1 !h-6 w-20 font-mono" />
                    <div class="relative w-6 h-6 rounded-full overflow-hidden border border-[var(--line-color)] shadow-sm shrink-0">
                        <input type="color" value={shadowTarget === 'icon' ? iconShadow.color : textShadow.color} on:input={(e) => updateShadow('color', (e.target as HTMLInputElement).value)} class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] text-gray-500 dark:text-gray-400 uppercase">模糊</label>
                    <input type="number" value={shadowTarget === 'icon' ? iconShadow.blur : textShadow.blur} on:input={(e) => updateShadow('blur', (e.target as HTMLInputElement).valueAsNumber)} class="input-field text-sm !px-1" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] text-gray-500 dark:text-gray-400 uppercase">水平偏移</label>
                    <input type="number" value={shadowTarget === 'icon' ? iconShadow.x : textShadow.x} on:input={(e) => updateShadow('x', (e.target as HTMLInputElement).valueAsNumber)} class="input-field text-sm !px-1" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] text-gray-500 dark:text-gray-400 uppercase">垂直偏移</label>
                    <input type="number" value={shadowTarget === 'icon' ? iconShadow.y : textShadow.y} on:input={(e) => updateShadow('y', (e.target as HTMLInputElement).valueAsNumber)} class="input-field text-sm !px-1" />
                </div>
                <div class="col-span-3 flex flex-col gap-1 mt-1">
                    <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                        <label>不透明度</label>
                        <span>{Math.round((shadowTarget === 'icon' ? iconShadow.alpha : textShadow.alpha) * 100)}%</span>
                    </div>
                    <input type="range" value={shadowTarget === 'icon' ? iconShadow.alpha : textShadow.alpha} on:input={(e) => updateShadow('alpha', parseFloat((e.target as HTMLInputElement).value))} min="0" max="1" step="0.01" class="range-slider h-1" />
                </div>
            </div>
        </div>

        <!-- Ratios -->
        <div class="flex flex-col gap-3">
            <label class="text-sm font-bold text-gray-700 dark:text-gray-300">画板比例 (多选)</label>
            <div class="grid grid-cols-2 gap-2">
                {#each ratios as ratio}
                    <label class="flex items-center gap-2 p-2 border border-[var(--line-color)] rounded-lg cursor-pointer hover:bg-[var(--btn-regular-bg)] transition-colors select-none">
                        <input type="checkbox" bind:checked={ratio.checked} class="accent-[var(--primary)] w-4 h-4" />
                        <span class="text-sm font-mono text-gray-700 dark:text-gray-300">{ratio.label}</span>
                    </label>
                {/each}
            </div>
        </div>

        <!-- Export -->
        <div class="bg-transparent rounded-lg p-4 space-y-4 border border-[var(--line-color)]">
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">导出设置</h4>

            <div class="space-y-3">
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-gray-500 dark:text-gray-400">文件名</label>
                    <input type="text" bind:value={exportConfig.filename} class="input-field w-full text-sm !py-1" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-xs text-gray-500 dark:text-gray-400">格式</label>
                    <div class="flex gap-2">
                        <label class="flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all text-xs {exportConfig.format === 'png' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--line-color)] bg-transparent text-gray-700 dark:text-gray-300'}">
                            <input type="radio" bind:group={exportConfig.format} value="png" class="hidden" />
                            <span class="font-bold">PNG</span>
                        </label>
                        <label class="flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all text-xs {exportConfig.format === 'svg' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--line-color)] bg-transparent text-gray-700 dark:text-gray-300'}">
                            <input type="radio" bind:group={exportConfig.format} value="svg" class="hidden" />
                            <span class="font-bold">SVG</span>
                        </label>
                    </div>
                </div>

                {#if exportConfig.format === 'png'}
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <label>缩放倍率</label>
                        </div>
                        <div class="grid grid-cols-4 gap-1">
                            {#each [1, 2, 3, 4] as scale}
                                <label class="flex items-center justify-center gap-1 p-1 border rounded cursor-pointer transition-all text-xs {exportConfig.scales.includes(scale) ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--line-color)] bg-transparent text-gray-700 dark:text-gray-300'}">
                                    <input
                                        type="checkbox"
                                        class="hidden"
                                        checked={exportConfig.scales.includes(scale)}
                                        on:change={(e) => {
                                            if (e.currentTarget.checked) {
                                                exportConfig.scales = [...exportConfig.scales, scale].sort();
                                            } else {
                                                exportConfig.scales = exportConfig.scales.filter(s => s !== scale);
                                            }
                                        }}
                                    />
                                    <span class="font-mono font-bold">{scale}x</span>
                                </label>
                            {/each}
                        </div>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5">
                            {Math.round(canvasWidth)}x{Math.round(canvasHeight)} px
                        </p>
                    </div>
                {/if}

                <label class="flex items-center justify-between p-2 bg-transparent rounded border border-[var(--line-color)] cursor-pointer">
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">背景透明</span>
                    <input type="checkbox" bind:checked={exportConfig.transparentBg} class="accent-[var(--primary)] w-4 h-4" />
                </label>

                <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <label>导出尺寸 (可多选)</label>
                    </div>
                    <div class="grid grid-cols-4 gap-1">
                        {#each activeRatios.length === 0 ? [] : (activeRatios.length === 1 ? [] : ratios) as ratio}
                            {#if activeRatios.find(r => r.label === ratio.label)}
                                <label class="flex items-center justify-center gap-1 p-1 border rounded cursor-pointer transition-all text-xs {exportConfig.exportRatios.includes(ratio.label) ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--line-color)] bg-transparent text-gray-700 dark:text-gray-300'}">
                                    <input
                                        type="checkbox"
                                        class="hidden"
                                        checked={exportConfig.exportRatios.includes(ratio.label)}
                                        on:change={(e) => {
                                            if (e.currentTarget.checked) {
                                                exportConfig.exportRatios = [...exportConfig.exportRatios, ratio.label];
                                            } else {
                                                exportConfig.exportRatios = exportConfig.exportRatios.filter(r => r !== ratio.label);
                                            }
                                        }}
                                    />
                                    <span class="font-mono font-bold">{ratio.label}</span>
                                </label>
                            {/if}
                        {/each}
                    </div>
                    {#if activeRatios.length === 0}
                        <p class="text-[10px] text-red-500 text-left mt-0.5 font-bold">
                            请至少选择一个画板比例以进行导出
                        </p>
                    {:else if activeRatios.length === 1}
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 text-left mt-0.5">
                            当前仅预览 {activeRatios[0].label}，将导出此尺寸
                        </p>
                    {:else}
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5">
                            不选默认导出预览选中比例
                        </p>
                    {/if}
                </div>
            </div>

            <button
                on:click={doExport}
                disabled={activeRatios.length === 0}
                class="w-full px-4 py-3 bg-[var(--primary)] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 rounded-xl font-bold transition-all shadow-lg shadow-[var(--primary)]/30 text-sm flex items-center justify-center gap-2 mt-2"
            >
                <Icon icon="material-symbols:download" class="w-5 h-5" />
                导出图片
            </button>
        </div>
    </div>
  </div>
</div>

<style>
    .input-field {
        @apply px-3 py-2 rounded-lg bg-transparent border border-[var(--line-color)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-colors text-gray-900 dark:text-gray-100;
    }
    .range-slider {
        @apply w-full accent-[var(--primary)] cursor-pointer;
    }

    :global(.dark) .input-field {
        color: #f3f4f6 !important;
        border-color: #4b5563 !important;
    }

    .input-field {
        border-color: #d1d5db;
    }

    :global(.dark) label, :global(.dark) span, :global(.dark) p, :global(.dark) h4 {
        color: #e5e7eb;
    }
    :global(.dark) .text-gray-500 {
        color: #9ca3af !important;
    }
</style>
