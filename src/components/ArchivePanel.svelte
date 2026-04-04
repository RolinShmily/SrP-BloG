<script lang="ts">
import { onMount } from "svelte";

import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getPostUrlBySlug } from "../utils/url-utils";

export let sortedPosts: Post[] = [];
export let allTags: { name: string; count: number }[] = [];

interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string;
		published: Date;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

let groups: Group[] = [];
let activeTags: string[] = [];
let expanded = false;

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

function toggleTag(tag: string) {
	const index = activeTags.indexOf(tag);
	if (index > -1) {
		activeTags = activeTags.filter((t) => t !== tag);
	} else {
		activeTags = [...activeTags, tag];
	}
	updateUrl();
	filterPosts();
}

function clearTags() {
	activeTags = [];
	updateUrl();
	filterPosts();
}

function updateUrl() {
	const url = new URL(window.location.href);
	if (activeTags.length > 0) {
		url.searchParams.delete("tag");
		activeTags.forEach((tag) => url.searchParams.append("tag", tag));
	} else {
		url.searchParams.delete("tag");
	}
	window.history.replaceState({}, "", url.toString());
}

function filterPosts() {
	let filteredPosts: Post[] = sortedPosts;

	if (activeTags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				post.data.tags.some((tag) => activeTags.includes(tag)),
		);
	}

	const params = new URLSearchParams(window.location.search);
	const categories = params.getAll("category");
	const uncategorized = params.get("uncategorized");

	if (categories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.category && categories.includes(post.data.category),
		);
	}

	if (uncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) => b.year - a.year);

	groups = groupedPostsArray;
}

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	activeTags = params.getAll("tag");
	if (activeTags.length > 0 || params.get("expanded") === "true") {
		expanded = true;
	}
	filterPosts();
});
</script>

<!-- 标签过滤区 -->
{#if allTags && allTags.length > 0}
<div class="card-base px-6 py-4 mb-4">
    <div class="flex items-start gap-2 overflow-hidden">
        <!-- 标签容器：折叠时一行裁剪，展开时自动换行 -->
        <div class="flex flex-wrap items-center gap-2 min-w-0 flex-1 {expanded ? '' : 'max-h-[2.25rem] overflow-hidden'}" transition:max-height duration-300>
            {#each allTags as tag}
                <button
                    class="px-2.5 py-1 text-sm rounded-md border transition-all font-medium whitespace-nowrap
                        {activeTags.includes(tag.name)
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                            : 'bg-[var(--card-bg)] text-[var(--btn-content)] border-black/10 dark:border-white/10 hover:border-[var(--primary)] hover:text-[var(--primary)]'}"
                    on:click={() => toggleTag(tag.name)}
                >
                    {tag.name}
                    <span class="ml-0.5 opacity-50 text-xs">({tag.count})</span>
                </button>
            {/each}
        </div>
        <!-- 操作按钮：始终锚定在第一行末尾 -->
        <div class="shrink-0 flex items-center gap-2 h-9">
            {#if activeTags.length > 0}
                <button
                    class="w-8 h-8 flex items-center justify-center rounded-lg transition-all
                        bg-black/[0.06] dark:bg-white/[0.06] text-red-400 border border-black/5 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800"
                    on:click={clearTags}
                    title="清除筛选"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            {:else}
                <!-- 占位：保留删除按钮的位置 -->
                <div class="w-8 h-8"></div>
            {/if}
            {#if allTags.length > 6}
                <button
                    class="w-8 h-8 flex items-center justify-center rounded-lg transition-all
                        bg-black/[0.06] dark:bg-white/[0.06] text-[var(--primary)] border border-black/5 dark:border-white/10 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
                    on:click={() => expanded = !expanded}
                    title={expanded ? '收起' : '展开'}
                >
                    {#if expanded}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    {/if}
                </button>
            {/if}
        </div>
    </div>
</div>
{/if}

<!-- 时间线（独立块） -->
{#if groups.length === 0}
    <div class="card-base px-8 py-12 text-center text-neutral-400 dark:text-neutral-500">
        <div class="text-4xl mb-3">📭</div>
        <div class="text-lg font-medium">没有找到匹配的文章</div>
        <div class="text-sm mt-1">试试清除标签过滤器？</div>
    </div>
{:else}
    <div class="card-base px-8 py-6">
        {#each groups as group}
            <div>
                <div class="flex flex-row w-full items-center h-[3.75rem]">
                    <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                        {group.year}
                    </div>
                    <div class="w-[15%] md:w-[10%]">
                        <div
                                class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                      -outline-offset-[2px] z-50 outline-3"
                        ></div>
                    </div>
                    <div class="w-[70%] md:w-[80%] transition text-left text-50">
                        {group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                    </div>
                </div>

                {#each group.posts as post}
                    <a
                            href={getPostUrlBySlug(post.slug)}
                            aria-label={post.data.title}
                            class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                    >
                        <div class="flex flex-row justify-start items-center h-full">
                            <!-- date -->
                            <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                                {formatDate(post.data.published)}
                            </div>

                            <!-- dot and line -->
                            <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                                <div
                                        class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                           bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                           outline outline-4 z-50
                           outline-[var(--card-bg)]
                           group-hover:outline-[var(--btn-plain-bg-hover)]
                           group-active:outline-[var(--btn-plain-bg-active)]"
                                ></div>
                            </div>

                            <!-- post title -->
                            <div
                                    class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                         group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                         text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                            >
                                {post.data.title}
                            </div>

                            <!-- tag list -->
                            <div
                                    class="hidden md:block md:w-[15%] text-left text-sm transition
                         whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                            >
                                {formatTag(post.data.tags)}
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/each}
    </div>
{/if}
