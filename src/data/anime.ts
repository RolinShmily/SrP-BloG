// 本地番剧数据配置
export type AnimeItem = {
  title: string;
  status: "watching" | "completed" | "planned";
  rating: number;
  cover: string;
  description: string;
  episodes: string;
  year: string;
  genre: string[];
  studio: string;
  link: string;
  progress: number;
  totalEpisodes: number;
  startDate: string;
  endDate: string;
};

const localAnimeList: AnimeItem[] = [
  {
    // 标题
    title: "Lycoris Recoil",
    // 观看状态 (completed: 已看完, watching: 观看中, planned: 想看)
    status: "completed",
    // 评分
    rating: 9.8,
    // 封面
    cover: "/assets/anime/lkls.webp",
    // 描述
    description: "Girl's gunfight",
    // 集数(官方)
    episodes: "12 episodes",
    // 年份
    year: "2022",
    // 类型
    genre: ["Action", "Slice of life"],
    // 工作室
    studio: "A-1 Pictures",
    // 链接
    link: "https://www.bilibili.com/bangumi/media/md28338623",
    // 进度集数
    progress: 12,
    // 总集数
    totalEpisodes: 12,
    // 开始观看时间
    startDate: "2022-07",
    // 
    endDate: "2022-09",
  }
];

export default localAnimeList;
