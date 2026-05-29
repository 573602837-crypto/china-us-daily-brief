import { SOURCES as LEGACY_SOURCES } from "@/config/sources";

export type ContentSourceType = "media" | "journal" | "think_tank" | "official" | "government";

export type ContentSource = {
  id: string;
  name: string;
  domain: string;
  type: ContentSourceType;
  homepageUrl: string;
  rssUrls: string[];
  sitemapUrls: string[];
  robotsUrl: string;
  indexPageUrls: string[];
  googleNewsQueries: string[];
  gdeltQueries: string[];
  enabled: boolean;
  reliability: number;
  maxItemsPerRun: number;
  notes?: string;
};

function getDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function sourceQuery(domain: string, terms: string): string {
  return `site:${domain} ${terms}`;
}

const LEGACY_CONTENT_SOURCES: ContentSource[] = LEGACY_SOURCES.map((source) => {
  const domain = getDomain(source.homepageUrl);

  return {
    id: source.id,
    name: source.name,
    domain,
    type: source.type,
    homepageUrl: source.homepageUrl,
    rssUrls: [source.rssUrl, ...(source.alternateRssUrls || [])].filter((url): url is string => Boolean(url)),
    sitemapUrls: source.sitemapUrls || [],
    robotsUrl: `${new URL(source.homepageUrl).origin}/robots.txt`,
    indexPageUrls: source.fallbackPageUrls || [],
    googleNewsQueries: [source.googleNewsQuery || sourceQuery(domain, "China OR Taiwan OR Trump OR Congress")],
    gdeltQueries: [
      `domain:${domain} (China OR Taiwan OR tariffs OR trade OR technology OR semiconductor)`,
      `domain:${domain} (Congress OR national security OR election OR Trump)`
    ],
    enabled: source.enabled,
    reliability: source.reliability,
    maxItemsPerRun: source.maxItemsPerRun || 16,
    notes: source.notes
  };
});

const OFFICIAL_CONTENT_SOURCES: ContentSource[] = [
  {
    id: "white-house",
    name: "White House",
    domain: "whitehouse.gov",
    type: "official",
    homepageUrl: "https://www.whitehouse.gov",
    rssUrls: ["https://www.whitehouse.gov/feed/"],
    sitemapUrls: ["https://www.whitehouse.gov/sitemap.xml", "https://www.whitehouse.gov/news-sitemap.xml"],
    robotsUrl: "https://www.whitehouse.gov/robots.txt",
    indexPageUrls: ["https://www.whitehouse.gov/briefing-room/"],
    googleNewsQueries: [
      sourceQuery("whitehouse.gov", "China OR Taiwan OR tariffs OR semiconductor OR national security")
    ],
    gdeltQueries: [
      "domain:whitehouse.gov (China OR Taiwan OR tariffs OR national security OR semiconductor)"
    ],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "state-department",
    name: "State Department",
    domain: "state.gov",
    type: "official",
    homepageUrl: "https://www.state.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.state.gov/sitemap.xml"],
    robotsUrl: "https://www.state.gov/robots.txt",
    indexPageUrls: ["https://www.state.gov/press-releases/"],
    googleNewsQueries: [sourceQuery("state.gov", "China OR Taiwan OR U.S.-China OR national security")],
    gdeltQueries: ["domain:state.gov (China OR Taiwan OR U.S.-China OR national security)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "department-of-defense",
    name: "Department of Defense",
    domain: "defense.gov",
    type: "government",
    homepageUrl: "https://www.defense.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.defense.gov/sitemap.xml"],
    robotsUrl: "https://www.defense.gov/robots.txt",
    indexPageUrls: ["https://www.defense.gov/News/Releases/", "https://www.defense.gov/News/News-Stories/"],
    googleNewsQueries: [sourceQuery("defense.gov", "China OR Taiwan OR Indo-Pacific OR national security")],
    gdeltQueries: ["domain:defense.gov (China OR Taiwan OR Indo-Pacific OR national security)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "department-of-commerce",
    name: "Department of Commerce",
    domain: "commerce.gov",
    type: "government",
    homepageUrl: "https://www.commerce.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.commerce.gov/sitemap.xml"],
    robotsUrl: "https://www.commerce.gov/robots.txt",
    indexPageUrls: ["https://www.commerce.gov/news/press-releases"],
    googleNewsQueries: [sourceQuery("commerce.gov", "China OR export controls OR semiconductor OR chips")],
    gdeltQueries: ["domain:commerce.gov (China OR export controls OR semiconductor OR chips)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "treasury",
    name: "Treasury",
    domain: "home.treasury.gov",
    type: "government",
    homepageUrl: "https://home.treasury.gov",
    rssUrls: [],
    sitemapUrls: ["https://home.treasury.gov/sitemap.xml"],
    robotsUrl: "https://home.treasury.gov/robots.txt",
    indexPageUrls: ["https://home.treasury.gov/news/press-releases"],
    googleNewsQueries: [sourceQuery("home.treasury.gov", "China OR sanctions OR tariffs OR trade")],
    gdeltQueries: ["domain:home.treasury.gov (China OR sanctions OR tariffs OR trade)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "ustr",
    name: "USTR",
    domain: "ustr.gov",
    type: "government",
    homepageUrl: "https://ustr.gov",
    rssUrls: [],
    sitemapUrls: ["https://ustr.gov/sitemap.xml"],
    robotsUrl: "https://ustr.gov/robots.txt",
    indexPageUrls: ["https://ustr.gov/about-us/policy-offices/press-office/press-releases"],
    googleNewsQueries: [sourceQuery("ustr.gov", "China OR tariffs OR trade OR supply chain")],
    gdeltQueries: ["domain:ustr.gov (China OR tariffs OR trade OR supply chain)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "congress-gov",
    name: "Congress.gov",
    domain: "congress.gov",
    type: "government",
    homepageUrl: "https://www.congress.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.congress.gov/sitemap.xml"],
    robotsUrl: "https://www.congress.gov/robots.txt",
    indexPageUrls: ["https://www.congress.gov/search"],
    googleNewsQueries: [sourceQuery("congress.gov", "China OR Taiwan OR semiconductor OR national security")],
    gdeltQueries: ["domain:congress.gov (China OR Taiwan OR semiconductor OR national security)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "govinfo",
    name: "GovInfo",
    domain: "govinfo.gov",
    type: "government",
    homepageUrl: "https://www.govinfo.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.govinfo.gov/sitemap.xml"],
    robotsUrl: "https://www.govinfo.gov/robots.txt",
    indexPageUrls: ["https://www.govinfo.gov/app/collection/FR"],
    googleNewsQueries: [sourceQuery("govinfo.gov", "China OR Taiwan OR export controls OR tariffs")],
    gdeltQueries: ["domain:govinfo.gov (China OR Taiwan OR export controls OR tariffs)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  },
  {
    id: "federal-register",
    name: "Federal Register",
    domain: "federalregister.gov",
    type: "government",
    homepageUrl: "https://www.federalregister.gov",
    rssUrls: [],
    sitemapUrls: ["https://www.federalregister.gov/sitemap.xml"],
    robotsUrl: "https://www.federalregister.gov/robots.txt",
    indexPageUrls: ["https://www.federalregister.gov/documents/search"],
    googleNewsQueries: [sourceQuery("federalregister.gov", "China OR export controls OR tariffs OR semiconductor")],
    gdeltQueries: ["domain:federalregister.gov (China OR export controls OR tariffs OR semiconductor)"],
    enabled: true,
    reliability: 5,
    maxItemsPerRun: 20
  }
];

export const CONTENT_SOURCES: ContentSource[] = [...LEGACY_CONTENT_SOURCES, ...OFFICIAL_CONTENT_SOURCES];
