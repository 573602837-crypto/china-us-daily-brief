import { CONTENT_SOURCES, type ContentSource, type ContentSourceType } from "@/config/content-sources";

export type PrimarySource = {
  id: string;
  name: string;
  domain: string;
  type: ContentSourceType;
  homepageUrl: string;
  sourceIds: string[];
  aliases?: string[];
};

export const PRIMARY_SOURCES: PrimarySource[] = [
  {
    id: "the-hill",
    name: "The Hill",
    domain: "thehill.com",
    type: "media",
    homepageUrl: "https://thehill.com",
    sourceIds: ["the-hill", "the-hill-technology", "the-hill-house", "the-hill-senate"]
  },
  {
    id: "axios",
    name: "Axios",
    domain: "axios.com",
    type: "media",
    homepageUrl: "https://www.axios.com",
    sourceIds: ["axios"]
  },
  {
    id: "politico",
    name: "Politico",
    domain: "politico.com",
    type: "media",
    homepageUrl: "https://www.politico.com",
    sourceIds: ["politico", "politico-congress", "politico-white-house", "politico-defense"]
  },
  {
    id: "fox-news",
    name: "Fox News",
    domain: "foxnews.com",
    type: "media",
    homepageUrl: "https://www.foxnews.com",
    sourceIds: ["fox-news-politics"],
    aliases: ["Fox News Politics"]
  },
  {
    id: "cnn",
    name: "CNN",
    domain: "cnn.com",
    type: "media",
    homepageUrl: "https://www.cnn.com",
    sourceIds: ["cnn-politics"],
    aliases: ["CNN Politics"]
  },
  {
    id: "boston-globe",
    name: "Boston Globe",
    domain: "bostonglobe.com",
    type: "media",
    homepageUrl: "https://www.bostonglobe.com",
    sourceIds: ["boston-globe"]
  },
  {
    id: "wall-street-journal",
    name: "Wall Street Journal",
    domain: "wsj.com",
    type: "media",
    homepageUrl: "https://www.wsj.com",
    sourceIds: ["wall-street-journal"],
    aliases: ["WSJ"]
  },
  {
    id: "washington-post",
    name: "Washington Post",
    domain: "washingtonpost.com",
    type: "media",
    homepageUrl: "https://www.washingtonpost.com",
    sourceIds: ["washington-post-politics"],
    aliases: ["Washington Post Politics", "WaPo"]
  },
  {
    id: "new-york-times",
    name: "New York Times",
    domain: "nytimes.com",
    type: "media",
    homepageUrl: "https://www.nytimes.com",
    sourceIds: ["new-york-times-politics", "new-york-times-world"],
    aliases: ["New York Times Politics", "New York Times World", "NYT"]
  },
  {
    id: "foreign-affairs",
    name: "Foreign Affairs",
    domain: "foreignaffairs.com",
    type: "journal",
    homepageUrl: "https://www.foreignaffairs.com",
    sourceIds: ["foreign-affairs"]
  },
  {
    id: "foreign-policy",
    name: "Foreign Policy",
    domain: "foreignpolicy.com",
    type: "journal",
    homepageUrl: "https://foreignpolicy.com",
    sourceIds: ["foreign-policy"]
  },
  {
    id: "the-atlantic",
    name: "The Atlantic",
    domain: "theatlantic.com",
    type: "journal",
    homepageUrl: "https://www.theatlantic.com",
    sourceIds: ["the-atlantic"]
  },
  {
    id: "national-security-action",
    name: "National Security Action",
    domain: "nationalsecurityaction.org",
    type: "think_tank",
    homepageUrl: "https://nationalsecurityaction.org",
    sourceIds: ["national-security-action"]
  },
  {
    id: "america-first-policy-institute",
    name: "America First Policy Institute",
    domain: "americafirstpolicy.com",
    type: "think_tank",
    homepageUrl: "https://www.americafirstpolicy.com",
    sourceIds: ["america-first-policy-institute"],
    aliases: ["AFPI"]
  },
  {
    id: "truth-social",
    name: "Truth Social",
    domain: "truthsocial.com",
    type: "social",
    homepageUrl: "https://truthsocial.com",
    sourceIds: ["truth-social"],
    aliases: ["realDonaldTrump"]
  }
];

export function normalizeSourceDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, "");
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function getContentSourcesForPrimary(primarySource: PrimarySource): ContentSource[] {
  const sourceIds = new Set(primarySource.sourceIds);
  const primaryDomain = normalizeSourceDomain(primarySource.domain);

  return CONTENT_SOURCES.filter((source) => {
    return sourceIds.has(source.id) || normalizeSourceDomain(source.domain) === primaryDomain;
  });
}

export function getPrimarySourceNames(primarySource: PrimarySource): string[] {
  const configuredNames = getContentSourcesForPrimary(primarySource).map((source) => source.name);
  return unique([primarySource.name, ...(primarySource.aliases || []), ...configuredNames]);
}

export function toCanonicalContentSource(primarySource: PrimarySource): ContentSource | null {
  const configuredSources = getContentSourcesForPrimary(primarySource);
  const fallback = configuredSources[0];

  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    id: primarySource.id,
    name: primarySource.name,
    domain: primarySource.domain,
    type: primarySource.type,
    homepageUrl: primarySource.homepageUrl,
    rssUrls: unique(configuredSources.flatMap((source) => source.rssUrls)),
    sitemapUrls: unique(configuredSources.flatMap((source) => source.sitemapUrls)),
    robotsUrl: `${new URL(primarySource.homepageUrl).origin}/robots.txt`,
    indexPageUrls: unique(configuredSources.flatMap((source) => source.indexPageUrls)),
    googleNewsQueries: unique(configuredSources.flatMap((source) => source.googleNewsQueries)),
    gdeltQueries: unique(configuredSources.flatMap((source) => source.gdeltQueries)),
    enabled: configuredSources.some((source) => source.enabled),
    reliability: Math.max(...configuredSources.map((source) => source.reliability)),
    maxItemsPerRun: Math.max(...configuredSources.map((source) => source.maxItemsPerRun)),
    notes: configuredSources.find((source) => source.notes)?.notes
  };
}

export function getPrimaryContentSources(): ContentSource[] {
  return PRIMARY_SOURCES.map(toCanonicalContentSource).filter((source): source is ContentSource => Boolean(source));
}
