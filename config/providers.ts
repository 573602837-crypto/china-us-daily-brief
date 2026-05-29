import { RELEVANCE_KEYWORDS } from "@/config/keywords";
import { TRACKED_PEOPLE } from "@/config/people";

export const NEWS_DOMAINS = [
  "thehill.com",
  "axios.com",
  "politico.com",
  "foxnews.com",
  "cnn.com",
  "bostonglobe.com",
  "wsj.com",
  "washingtonpost.com",
  "nytimes.com",
  "foreignaffairs.com",
  "foreignpolicy.com",
  "theatlantic.com",
  "nationalsecurityaction.org",
  "americafirstpolicy.com"
];

export const GOOGLE_NEWS_QUERY_GROUPS = [
  {
    id: "core",
    terms: ["China", "U.S.-China", "Taiwan"]
  },
  {
    id: "trade-tech",
    terms: ["tariffs", "trade", "technology", "AI", "semiconductor", "chip", "export controls"]
  },
  {
    id: "us-politics",
    terms: ["Congress", "national security", "election", "Trump", "Democrats", "Republicans"]
  },
  {
    id: "republican-people",
    terms: [
      "Donald Trump",
      "JD Vance",
      "Marco Rubio",
      "Pete Hegseth",
      "Scott Bessent",
      "Howard Lutnick",
      "Mike Johnson",
      "John Thune",
      "Elise Stefanik",
      "Robert Lighthizer",
      "Stephen Miller",
      "Michael Needham",
      "Mike Needham",
      "Susie Wiles"
    ]
  },
  {
    id: "democratic-people",
    terms: [
      "Gavin Newsom",
      "Jake Sullivan",
      "Joe Biden",
      "Kamala Harris",
      "Antony Blinken",
      "Chuck Schumer",
      "Hakeem Jeffries",
      "Nancy Pelosi"
    ]
  }
];

export const GDELT_QUERY_GROUPS = [
  {
    id: "china-policy",
    terms: ["China", "Taiwan", "tariffs", "trade", "technology", "semiconductor"]
  },
  {
    id: "us-politics",
    terms: ["Congress", "national security", "election", "Trump"]
  },
  {
    id: "tracked-people",
    terms: TRACKED_PEOPLE.flatMap((person) => person.aliases.slice(0, 1)).slice(0, 12)
  }
];

export const TOPIC_SEARCH_TERMS = RELEVANCE_KEYWORDS;

export const PUBLIC_PAGE_SOURCE_IDS = [
  "axios",
  "washington-post-politics",
  "foreign-affairs",
  "national-security-action",
  "america-first-policy-institute"
];

export const SITEMAP_SOURCE_IDS = [
  "axios",
  "washington-post-politics",
  "foreign-affairs",
  "national-security-action",
  "america-first-policy-institute"
];
