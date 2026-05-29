export const appConfig = {
  siteName: "中美关系与美国政治动态每日简报",
  siteDescription: "面向中文用户的中美关系、美国政治与对华政策新闻数据库。",
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  timezone: process.env.BRIEF_TIMEZONE || "Asia/Shanghai",
  defaultBriefHour: Number(process.env.DEFAULT_BRIEF_HOUR || "7"),
  cronSecret: process.env.CRON_SECRET || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini"
} as const;
