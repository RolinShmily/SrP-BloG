<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import Highlight from "./Highlight.svelte";

interface SearchResult {
	url: string;
	meta: {
		title: string;
	};
	excerpt: string;
	urlPath?: string;
	highlightQuery?: string;
	matchCount: number;
}

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
// biome-ignore lint/suspicious/noExplicitAny: Temporary usage of any for posts array
let posts: any[] = [];

const searchTypes = [
	{ id: "title", label: "标题" },
	{ id: "description", label: "简介" },
	{ id: "content", label: "正文" },
	{ id: "link", label: "路径" },
];
let selectedTypes: string[] = [];
let isMultiSelect = false;

const toggleType = (typeId: string) => {
	if (isMultiSelect) {
		if (selectedTypes.includes(typeId)) {
			selectedTypes = selectedTypes.filter((t) => t !== typeId);
		} else {
			selectedTypes = [...selectedTypes, typeId];
		}
	} else {
		if (selectedTypes.includes(typeId) && selectedTypes.length === 1) {
			selectedTypes = [];
		} else {
			selectedTypes = [typeId];
		}
	}
};

const togglePanel = () => {
	if (typeof document === "undefined") return;
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const closePanel = () => {
	if (typeof document === "undefined") return;
	const panel = document.getElementById("search-panel");
	panel?.classList.add("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	if (typeof document === "undefined") return;
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

const search = async (
	keyword: string,
	isDesktop: boolean,
	types: string[] = selectedTypes,
): Promise<void> => {
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}

	isSearching = true;

	try {
		const keywords = keyword
			.toLowerCase()
			.split(/\s+/)
			.filter((k) => k.length > 0);

		const searchResults = posts
			.filter((post) => {
				const titleLower = post.title.toLowerCase();
				const descriptionLower = post.description.toLowerCase();
				const contentLower = post.content.toLowerCase();
				const linkLower = post.link.toLowerCase();

				let searchText = "";
				if (types.length === 0) {
					searchText = `${titleLower} ${descriptionLower} ${contentLower} ${linkLower}`;
				} else {
					if (types.includes("title")) searchText += ` ${titleLower}`;
					if (types.includes("description"))
						searchText += ` ${descriptionLower}`;
					if (types.includes("content")) searchText += ` ${contentLower}`;
					if (types.includes("link")) searchText += ` ${linkLower}`;
				}

				return keywords.every((k) => searchText.includes(k));
			})
			.map((post) => {
				const titleLower = post.title.toLowerCase();
				const descriptionLower = post.description.toLowerCase();
				const contentLower = post.content.toLowerCase();
				const linkLower = post.link.toLowerCase();

				let excerpt = "";
				const firstKeyword = keywords[0];
				const contentIndex = contentLower.indexOf(firstKeyword);
				if (contentIndex !== -1) {
					const start = Math.max(0, contentIndex - 50);
					const end = Math.min(post.content.length, contentIndex + 100);
					excerpt = post.content.substring(start, end);
					if (start > 0) excerpt = `...${excerpt}`;
					if (end < post.content.length) excerpt = `${excerpt}...`;
				} else {
					excerpt = post.description || `${post.content.substring(0, 150)}...`;
				}

				let matchCount = 0;
				keywords.forEach((k) => {
					const regex = new RegExp(
						k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
						"gi",
					);

					if (types.length === 0 || types.includes("title")) {
						const matches = titleLower.match(regex);
						if (matches) matchCount += matches.length;
					}
					if (types.length === 0 || types.includes("description")) {
						const matches = descriptionLower.match(regex);
						if (matches) matchCount += matches.length;
					}
					if (types.length === 0 || types.includes("content")) {
						const matches = contentLower.match(regex);
						if (matches) matchCount += matches.length;
					}
					if (types.length === 0 || types.includes("link")) {
						const matches = linkLower.match(regex);
						if (matches) matchCount += matches.length;
					}
				});

				return {
					url: url(`/posts/${post.link}/`),
					meta: { title: post.title },
					excerpt,
					urlPath: `/posts/${post.link}`,
					highlightQuery: keyword,
					matchCount,
				};
			})
			.sort((a, b) => b.matchCount - a.matchCount);

		result = searchResults;
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

onMount(async () => {
	try {
		const response = await fetch("/rss.xml");
		const text = await response.text();
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, "text/xml");
		const items = xml.querySelectorAll("item");

		posts = Array.from(items).map((item) => {
			// 尝试多种方式获取content:encoded内容
			let content = "";
			const contentEncoded =
				item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
				item.querySelector("*|encoded")?.textContent ||
				"";

			if (contentEncoded) {
				content = contentEncoded.replace(/<[^>]*>/g, "");
			}

			return {
				title: item.querySelector("title")?.textContent || "",
				description: item.querySelector("description")?.textContent || "",
				content: content,
				link:
					item
						.querySelector("link")
						?.textContent?.replace(/.*\/posts\/(.*?)\//, "$1") || "",
			};
		});
	} catch (error) {
		console.error("Error fetching RSS:", error);
	}
});

$: {
	if (keywordDesktop) {
		search(keywordDesktop, true, selectedTypes);
	} else if (keywordMobile) {
		search(keywordMobile, false, selectedTypes);
	} else {
		result = [];
		setPanelVisibility(false, true);
	}
}
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => search(keywordDesktop, true, selectedTypes)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder="Search" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search types -->
    <div class="flex flex-wrap gap-2 px-3 py-2 border-b border-white/5 items-center">
        <button
            class="px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1 {isMultiSelect ? 'bg-[var(--primary)] text-white' : 'bg-black/[0.04] dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/10'}"
            on:click={() => {
                isMultiSelect = !isMultiSelect;
                if (!isMultiSelect && selectedTypes.length > 1) {
                    selectedTypes = [selectedTypes[0]];
                }
            }}
        >
            <Icon icon={isMultiSelect ? "material-symbols:check-box" : "material-symbols:check-box-outline-blank"} class="text-sm" />
            多选
        </button>
        <div class="w-[1px] h-3 bg-black/10 dark:bg-white/10 mx-1"></div>
        {#each searchTypes as type}
            <button
                class="px-2 py-1 text-xs rounded-md transition-all {selectedTypes.includes(type.id) ? 'bg-[var(--primary)] text-white' : 'bg-black/[0.04] dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/10'}"
                on:click={() => toggleType(type.id)}
            >
                {type.label}
            </button>
        {/each}
    </div>

    <!-- search results header -->
    {#if result.length > 0}
        <div class="text-xs text-black/40 dark:text-white/40 px-3 py-2 border-b border-black/[0.04] dark:border-white/5">
            {result.length} 条搜索结果
        </div>
    {/if}

    <!-- search results -->
    {#each result as item}
        <a href={item.url} on:click={closePanel}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                <Highlight text={item.meta.title} query={item.highlightQuery} />
                <Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-xs text-black/50 dark:text-white/50 mb-1 font-mono">
                <Highlight text={item.urlPath} query={item.highlightQuery} />
                <span class="ml-2 text-[var(--primary)]">命中 {item.matchCount} 个关键词</span>
            </div>
            <div class="transition text-sm text-50">
                <Highlight text={item.excerpt} query={item.highlightQuery} />
            </div>
        </a>
    {/each}
</div>

<style>
  :global(.hl) {
    color: var(--primary);
  }
  :global(.hl.no-wrap) {
    white-space: nowrap;
    display: inline-block;
  }
  input:focus {
    outline: 0;
  }
  .search-panel {
    /*添加不透明搜索背景*/
    background-color: var(--float-panel-bg-opaque);

    max-height: calc(100vh - 100px);
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .search-panel::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  .search-panel :global(mark) {
    color: var(--primary);
    background: none;
  }
</style>
