# 中美关系与美国政治动态每日简报

独立于旧 `daily brief` 网站的本地可运行 MVP。第一阶段采用：

- 本地网站：Next.js + TypeScript + Tailwind CSS + Prisma + SQLite
- 云端抓取：GitHub Actions 定时运行
- 数据入口：公开 RSS、公开 sitemap / news sitemap、Google News RSS、GDELT 公开接口、少量公开索引页元数据
- 数据保存：`data/articles/YYYY-MM-DD.json`

不使用付费 API，不使用镜像网站，不绕过付费墙，不抓取付费正文。

## 本地运行

```bash
cd /Users/chenzhixiang/Desktop/codex/china-us-daily-brief
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 自动抓取

GitHub Actions 已配置为每天北京时间 07:00 自动运行。GitHub Actions 的 cron 使用 UTC，因此工作流里对应的是：

```yaml
cron: "0 23 * * *"
```

抓取任务会运行：

```bash
npm run fetch:daily
```

抓取结果会写入：

```text
data/articles/YYYY-MM-DD.json
data/runs/YYYY-MM-DD.json
```

如果本地网络无法访问 Google News 或 GDELT，网站仍然可以运行；云端 GitHub Actions 会在 GitHub 网络环境里定时抓取。

首页不再直接调用 EdgeOne 上的 `/api/fetch`，避免静态部署环境返回 HTML 导致“接口没有返回 JSON”。需要临时测试时，可以在本地运行 `npm run fetch:daily`，或在 GitHub Actions 页面手动触发 `workflow_dispatch`。

## GitHub Actions

工作流文件：

```text
.github/workflows/daily-news.yml
```

功能：

- 每天北京时间 07:00 自动运行一次
- 支持手动 `workflow_dispatch`
- 安装依赖
- 运行 `npm run fetch:daily`
- 如果 `data/articles` 或 `data/runs` 有变化，自动 commit 回仓库

第一阶段不需要 API key。以后如果提供 `OPENAI_API_KEY`，摘要模块会自动尝试用模型优化中文标题和摘要；没有 key 时使用规则摘要。

## 配置文件

- `config/content-sources.ts`：真实内容来源，包括媒体、智库、官方来源和 Truth Social
- `config/tracked-entities.ts`：人物、机构、团队、议题等追踪实体
- `config/query-matrix.ts`：source/entity/issue 三层自动发现查询组合
- `config/sources.ts`：旧版公开 RSS 来源，仍会映射进 ContentSource
- `config/people.ts`：重点人物与别名
- `config/keywords.ts`：相关性关键词
- `config/topics.ts`：主题分类规则

## Provider

- `RssProvider`：公开 RSS
- `SitemapProvider`：公开 sitemap / news sitemap
- `GoogleNewsRssProvider`：Google News RSS，无需 API key
- `GdeltProvider`：GDELT 公开接口，无需 API key
- `PublicPageProvider`：仅读取公开索引页里的标题、链接和公开片段，用于无稳定 RSS 的来源

任一 provider 或查询失败都不会中断整个任务；错误会写入 `data/runs/YYYY-MM-DD.json`。
