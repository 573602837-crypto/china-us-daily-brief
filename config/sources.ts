export type SourceType = "media" | "journal" | "think_tank";

export type SourceConfig = {
  id: string;
  name: string;
  type: SourceType;
  homepageUrl: string;
  rssUrl?: string;
  alternateRssUrls?: string[];
  fallbackPageUrls?: string[];
  sitemapUrls?: string[];
  googleNewsQuery?: string;
  enabled: boolean;
  reliability: number;
  maxItemsPerRun?: number;
  notes?: string;
};

export const SOURCES: SourceConfig[] = [
  {
    id: "the-hill",
    name: "The Hill",
    type: "media",
    homepageUrl: "https://thehill.com",
    rssUrl: "https://thehill.com/policy/international/feed/",
    fallbackPageUrls: ["https://thehill.com/policy/international/"],
    googleNewsQuery: "site:thehill.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 12,
    notes: "使用国际政策板块 feed，避免全站 feed 刷屏。"
  },
  {
    id: "the-hill-technology",
    name: "The Hill",
    type: "media",
    homepageUrl: "https://thehill.com/policy/technology/",
    rssUrl: "https://thehill.com/policy/technology/feed/",
    fallbackPageUrls: ["https://thehill.com/policy/technology/"],
    googleNewsQuery: "site:thehill.com technology China OR AI OR chip OR semiconductor",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 8
  },
  {
    id: "the-hill-house",
    name: "The Hill",
    type: "media",
    homepageUrl: "https://thehill.com/homenews/house/",
    rssUrl: "https://thehill.com/homenews/house/feed/",
    fallbackPageUrls: ["https://thehill.com/homenews/house/"],
    googleNewsQuery: "site:thehill.com House China OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 8
  },
  {
    id: "the-hill-senate",
    name: "The Hill",
    type: "media",
    homepageUrl: "https://thehill.com/homenews/senate/",
    rssUrl: "https://thehill.com/homenews/senate/feed/",
    fallbackPageUrls: ["https://thehill.com/homenews/senate/"],
    googleNewsQuery: "site:thehill.com Senate China OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 8
  },
  {
    id: "axios",
    name: "Axios",
    type: "media",
    homepageUrl: "https://www.axios.com",
    rssUrl: "https://www.axios.com/feeds/feed.rss",
    alternateRssUrls: ["https://api.axios.com/feed/"],
    fallbackPageUrls: [
      "https://www.axios.com/politics-policy",
      "https://www.axios.com/world",
      "https://www.axios.com/technology"
    ],
    sitemapUrls: ["https://www.axios.com/sitemaps/last200.xml", "https://www.axios.com/sitemap.xml"],
    googleNewsQuery: "site:axios.com China OR Taiwan OR Trump OR Congress OR technology",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 20
  },
  {
    id: "politico",
    name: "Politico",
    type: "media",
    homepageUrl: "https://www.politico.com",
    rssUrl: "https://rss.politico.com/politics-news.xml",
    fallbackPageUrls: ["https://www.politico.com/news/politics"],
    googleNewsQuery: "site:politico.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 16
  },
  {
    id: "politico-congress",
    name: "Politico",
    type: "media",
    homepageUrl: "https://www.politico.com/news/congress",
    rssUrl: "https://rss.politico.com/congress.xml",
    fallbackPageUrls: ["https://www.politico.com/news/congress"],
    googleNewsQuery: "site:politico.com Congress China OR Taiwan OR Trump",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 14
  },
  {
    id: "politico-white-house",
    name: "Politico",
    type: "media",
    homepageUrl: "https://www.politico.com/news/white-house",
    rssUrl: "https://rss.politico.com/whitehouse.xml",
    fallbackPageUrls: ["https://www.politico.com/news/white-house"],
    googleNewsQuery: "site:politico.com White House China OR Taiwan OR Trump",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 14
  },
  {
    id: "politico-defense",
    name: "Politico",
    type: "media",
    homepageUrl: "https://www.politico.com/news/defense",
    rssUrl: "https://rss.politico.com/defense.xml",
    fallbackPageUrls: ["https://www.politico.com/news/defense"],
    googleNewsQuery: "site:politico.com Pentagon China OR Taiwan OR defense",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 10
  },
  {
    id: "fox-news-politics",
    name: "Fox News Politics",
    type: "media",
    homepageUrl: "https://www.foxnews.com/politics",
    rssUrl: "https://moxie.foxnews.com/google-publisher/politics.xml",
    fallbackPageUrls: ["https://www.foxnews.com/politics", "https://www.foxnews.com/category/world/conflicts/china"],
    googleNewsQuery: "site:foxnews.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 3,
    maxItemsPerRun: 20
  },
  {
    id: "cnn-politics",
    name: "CNN Politics",
    type: "media",
    homepageUrl: "https://www.cnn.com/politics",
    rssUrl: "http://rss.cnn.com/rss/cnn_allpolitics.rss",
    alternateRssUrls: ["https://rss.cnn.com/rss/cnn_allpolitics.rss"],
    fallbackPageUrls: ["https://www.cnn.com/politics", "https://www.cnn.com/world/china"],
    googleNewsQuery: "site:cnn.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 20
  },
  {
    id: "boston-globe",
    name: "Boston Globe",
    type: "media",
    homepageUrl: "https://www.bostonglobe.com",
    rssUrl: "https://www.bostonglobe.com/rss/nation",
    fallbackPageUrls: ["https://www.bostonglobe.com/nation/", "https://www.bostonglobe.com/metro/"],
    googleNewsQuery: "site:bostonglobe.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 3,
    maxItemsPerRun: 12,
    notes: "RSS 可用性可能变化；失败时只记录状态，不绕过访问限制。"
  },
  {
    id: "wall-street-journal",
    name: "Wall Street Journal",
    type: "media",
    homepageUrl: "https://www.wsj.com",
    rssUrl: "https://feeds.a.dj.com/rss/RSSPoliticsAndPolicy.xml",
    alternateRssUrls: ["https://feeds.a.dj.com/rss/RSSWorldNews.xml"],
    fallbackPageUrls: ["https://www.wsj.com/politics/policy", "https://www.wsj.com/world/china"],
    googleNewsQuery: "site:wsj.com China OR Taiwan OR Trump OR tariffs OR chips",
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 16,
    notes: "只使用公开 RSS 元数据，不绕过付费墙。"
  },
  {
    id: "washington-post-politics",
    name: "Washington Post Politics",
    type: "media",
    homepageUrl: "https://www.washingtonpost.com/politics/",
    rssUrl: "https://www.washingtonpost.com/arcio/rss/category/politics/",
    alternateRssUrls: [
      "https://www.washingtonpost.com/arcio/rss/category/world/",
      "https://www.washingtonpost.com/arcio/rss/category/business/technology/",
      "https://feeds.washingtonpost.com/rss/politics",
      "https://www.washingtonpost.com/politics/?outputType=rss"
    ],
    fallbackPageUrls: [
      "https://www.washingtonpost.com/politics/",
      "https://www.washingtonpost.com/world/asia-pacific/",
      "https://www.washingtonpost.com/business/technology/"
    ],
    sitemapUrls: [
      "https://www.washingtonpost.com/sitemap.xml",
      "https://www.washingtonpost.com/news-sitemap.xml",
      "https://www.washingtonpost.com/arcio/news-sitemap/"
    ],
    googleNewsQuery: "site:washingtonpost.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 16,
    notes: "只使用公开 RSS 元数据，不绕过付费墙。"
  },
  {
    id: "new-york-times-politics",
    name: "New York Times Politics",
    type: "media",
    homepageUrl: "https://www.nytimes.com/section/politics",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    fallbackPageUrls: ["https://www.nytimes.com/section/politics"],
    googleNewsQuery: "site:nytimes.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 16,
    notes: "只使用公开 RSS 元数据，不绕过付费墙。"
  },
  {
    id: "new-york-times-world",
    name: "New York Times World",
    type: "media",
    homepageUrl: "https://www.nytimes.com/section/world",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    fallbackPageUrls: ["https://www.nytimes.com/section/world/asia", "https://www.nytimes.com/section/business"],
    googleNewsQuery: "site:nytimes.com China OR Taiwan OR tariffs OR chips OR technology",
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 16
  },
  {
    id: "foreign-affairs",
    name: "Foreign Affairs",
    type: "journal",
    homepageUrl: "https://www.foreignaffairs.com",
    rssUrl: "https://www.foreignaffairs.com/rss.xml",
    alternateRssUrls: [
      "https://www.foreignaffairs.com/feeds/region/China/rss.xml",
      "https://www.foreignaffairs.com/feeds/region/Asia/rss.xml",
      "https://www.foreignaffairs.com/feeds/region/United%20States/rss.xml",
      "https://www.foreignaffairs.com/feeds/topic/Trade/rss.xml"
    ],
    fallbackPageUrls: ["https://www.foreignaffairs.com/china", "https://www.foreignaffairs.com/united-states"],
    sitemapUrls: [
      "https://www.foreignaffairs.com/sitemap.xml",
      "https://www.foreignaffairs.com/sitemap-news.xml"
    ],
    googleNewsQuery: "site:foreignaffairs.com China OR Taiwan OR United States",
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 16
  },
  {
    id: "foreign-policy",
    name: "Foreign Policy",
    type: "journal",
    homepageUrl: "https://foreignpolicy.com",
    rssUrl: "https://foreignpolicy.com/feed/",
    fallbackPageUrls: [
      "https://foreignpolicy.com/channel/china/",
      "https://foreignpolicy.com/projects/china-brief/",
      "https://foreignpolicy.com/channel/united-states/"
    ],
    googleNewsQuery: "site:foreignpolicy.com China OR Taiwan OR Trump OR Congress",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 16
  },
  {
    id: "the-atlantic",
    name: "The Atlantic",
    type: "journal",
    homepageUrl: "https://www.theatlantic.com",
    rssUrl: "https://www.theatlantic.com/feed/all/",
    fallbackPageUrls: ["https://www.theatlantic.com/politics/", "https://www.theatlantic.com/international/"],
    googleNewsQuery: "site:theatlantic.com China OR Taiwan OR Trump OR politics",
    enabled: true,
    reliability: 4,
    maxItemsPerRun: 16
  },
  {
    id: "national-security-action",
    name: "National Security Action",
    type: "think_tank",
    homepageUrl: "https://nationalsecurityaction.org",
    fallbackPageUrls: [
      "https://nationalsecurityaction.org/resource-hub",
      "https://nationalsecurityaction.org/issue-papers-main",
      "https://nationalsecurityaction.org/talking-points-main",
      "https://nationalsecurityaction.org/polling-research-main"
    ],
    sitemapUrls: ["https://nationalsecurityaction.org/sitemap.xml"],
    googleNewsQuery: "site:nationalsecurityaction.org China OR Taiwan OR Trump",
    enabled: true,
    reliability: 3,
    maxItemsPerRun: 12,
    notes: "无稳定 RSS 时，仅读取公开资源索引页标题与片段。"
  },
  {
    id: "america-first-policy-institute",
    name: "America First Policy Institute",
    type: "think_tank",
    homepageUrl: "https://www.americafirstpolicy.com",
    fallbackPageUrls: [
      "https://www.americafirstpolicy.com/issues",
      "https://www.americafirstpolicy.com/newsroom",
      "https://www.americafirstpolicy.com"
    ],
    sitemapUrls: [
      "https://www.americafirstpolicy.com/sitemap.xml",
      "https://www.americafirstpolicy.com/server-sitemap.xml",
      "https://www.americafirstpolicy.com/sitemap-0.xml"
    ],
    googleNewsQuery: "site:americafirstpolicy.com China OR Taiwan OR Trump OR trade",
    enabled: true,
    reliability: 3,
    maxItemsPerRun: 12,
    notes: "无稳定 RSS 时，仅读取公开索引页标题与片段。"
  }
];
