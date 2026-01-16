import type { FrlinkContent } from "@/types/data";

// 导入所有友链 JSON 文件
const modules = import.meta.glob<{ default: FrlinkContent }>("./frlinks/*.json", {
  eager: true,
});

export async function getFrlinks(): Promise<FrlinkContent[]> {
  // 提取并排序所有友链数据（过滤无效模块）
  return Object.values(modules)
    .map((mod) => mod.default)
    .filter((link): link is FrlinkContent => link !== undefined && link !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
