export function escapeHtml(str: string): string {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function escapeRegExp(str: string): string {
	return (str || "").replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

export function highlightText(text: string, keyword: string): string {
	if (!text) return "";
	if (!keyword) return escapeHtml(text);

	const keywords = keyword.split(/\s+/).filter((k) => k.length > 0);
	if (keywords.length === 0) return escapeHtml(text);

	let result = escapeHtml(text);
	keywords.forEach((k) => {
		const reg = new RegExp(`(${escapeRegExp(k)})`, "ig");
		result = result.replace(reg, '<span class="hl no-wrap">$1</span>');
	});
	return result;
}
