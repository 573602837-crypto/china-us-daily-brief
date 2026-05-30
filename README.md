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

## 手动抓取

```bash
npm run fetch:daily
```

抓取结果会写入：

```text
data/articles/YYYY-MM-DD.json
data/runs/YYYY-MM-DD.json
```

如果本地网络无法访问 Google News 或 GDELT，网站仍然可以运行；云端 GitHub Actions 会在 GitHub 网络环境里定时抓取。

首页“手动更新”按钮在本地会直接调用 `/api/fetch` 运行抓取。部署到 EdgeOne 后，推荐让按钮触发 GitHub Actions，而不是在边缘环境里直接抓取和写文件；需要在 EdgeOne 环境变量里配置：

```text
GITHUB_ACTIONS_TRIGGER_TOKEN=你的 GitHub fine-grained token 或 PAT
GITHUB_ACTIONS_REPOSITORY=owner/repo
GITHUB_ACTIONS_WORKFLOW=daily-news.yml
GITHUB_ACTIONS_REF=main
```

没有这些变量时，线上按钮会返回明确错误提示；GitHub Actions 的定时抓取仍然照常工作。

## GitHub Actions

工作流文件：

```text
.github/workflows/daily-news.yml
```

功能：

- 每天北京时间早上自动运行一次
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
