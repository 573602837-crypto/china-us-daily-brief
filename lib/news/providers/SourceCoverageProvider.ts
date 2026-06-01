import { CONTENT_SOURCES, type ContentSource } from "@/config/content-sources";
import type { DiscoveryJob } from "@/lib/news/discovery/types";
import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import { buildProviderLog, fetchText } from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  sourceCommonName?: string;
  domain?: string;
  snippet?: string;
};

const COVERAGE_TERMS =
  "(China OR Taiwan OR Trump OR Congress OR tariffs OR trade OR technology OR semiconductor OR \"national security\" OR \"foreign policy\")";

const KNOWN_SOURCE_NAMES: Record<string, string> = {
  "thehill.com": "The Hill",
  "axios.com": "Axios",
  "politico.com": "Politico",
  "foxnews.com": "Fox News",
  "cnn.com": "CNN",
  "bostonglobe.com": "Boston Globe",
  "wsj.com": "Wall Street Journal",
  "washingtonpost.com": "Washington Post",
  "nytimes.com": "New York Times",
  "foreignaffairs.com": "Foreign Affairs",
  "foreignpolicy.com": "Foreign Policy",
  "theatlantic.com": "The Atlantic",
  "nationalsecurityaction.org": "National Security Action",
  "americafirstpolicy.com": "America First Policy Institute",
  "truthsocial.com": "Truth Social",
  "whitehouse.gov": "White House",
  "state.gov": "State Department",
  "defense.gov": "Department of Defense",
  "commerce.gov": "Department of Commerce",
  "home.treasury.gov": "Treasury",
  "ustr.gov": "USTR",
  "congress.gov": "Congress.gov",
  "govinfo.gov": "GovInfo",
  "federalregister.gov": "Federal Register"
};

function enabled(): boolean {
  return !["0", "false", "no"].includes((process.env.SOURCE_COVERAGE_ENABLED || "1").toLowerCase());
}

function uniqueSources(): ContentSource[] {
  const seenDomains = new Set<string>();
  const sources: ContentSource[] = [];

  for (const source of CONTENT_SOURCES.filter((item) => item.enabled)) {
    if (seenDomains.has(source.domain)) {
      continue;
    }

    seenDomains.add(source.domain);
    sources.push(source);
  }

  const limit = Number(process.env.SOURCE_COVERAGE_MAX_SOURCES || "40");
  return Number.isFinite(limit) && limit > 0 ? sources.slice(0, limit) : sources;
}

function queriesForSource(source: ContentSource): string[] {
  const baseQueries = source.gdeltQueries.length
    ? source.gdeltQueries
    : [`domain:${source.domain} ${COVERAGE_TERMS}`];
  const nameFallback = `"${source.name}" ${COVERAGE_TERMS}`;
  const maxQueries = source.type === "think_tank" || source.type === "social" ? 2 : 1;
  const configuredLimit = Number(process.env.SOURCE_COVERAGE_QUERIES_PER_SOURCE || String(maxQueries));
  const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : maxQueries;

  return Array.from(new Set([...baseQueries, nameFallback])).slice(0, limit);
}

function buildGdeltUrl(query: string): string {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: process.env.SOURCE_COVERAGE_MAX_RECORDS || "5",
    sort: "hybridrel",
    timespan: process.env.SOURCE_COVERAGE_TIMESPAN || "3d"
  });

  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastRequestAt = 0;

async function waitForGdeltSlot(): Promise<void> {
  const minIntervalMs = Number(process.env.GDELT_MIN_INTERVAL_MS || "5500");
  const interval = Number.isFinite(minIntervalMs) && minIntervalMs > 0 ? minIntervalMs : 5500;
  const elapsed = Date.now() - lastRequestAt;

  if (lastRequestAt > 0 && elapsed < interval) {
    await wait(interval - elapsed);
  }

  lastRequestAt = Date.now();
}

async function fetchGdeltJson(url: string): Promise<string> {
  await waitForGdeltSlot();
  const text = await fetchText(url, Number(process.env.SOURCE_COVERAGE_TIMEOUT_MS || "25000"));

  if (text.includes("Please limit requests")) {
    await wait(Number(process.env.GDELT_MIN_INTERVAL_MS || "5500"));
    await waitForGdeltSlot();
    return fetchText(url, Number(process.env.SOURCE_COVERAGE_TIMEOUT_MS || "25000"));
  }

  return text;
}

function sourceNameFromDomain(domain: string, fallback?: string): string {
  return KNOWN_SOURCE_NAMES[domain] || fallback || domain;
}

export class SourceCoverageProvider implements NewsProvider {
  name = "SourceCoverageProvider";

  async fetch(_discoveryJobs: DiscoveryJob[]): Promise<ProviderFetchResult> {
    if (!enabled()) {
      return {
        candidates: [],
        logs: [
          buildProviderLog({
            providerName: this.name,
            query: "source coverage disabled",
            status: "success",
            totalFetched: 0
          })
        ]
      };
    }

    const candidates: ProviderFetchResult["candidates"] = [];
    const logs: ProviderFetchResult["logs"] = [];

    for (const source of uniqueSources()) {
      for (const query of queriesForSource(source)) {
        try {
          const json = await fetchGdeltJson(buildGdeltUrl(query));
          const parsed = JSON.parse(json) as { articles?: GdeltArticle[] };
          const articles = (parsed.articles || [])
            .filter((article) => article.url && article.title)
            .slice(0, Number(process.env.SOURCE_COVERAGE_CANDIDATES_PER_QUERY || "5"))
            .map((article) => {
              const domain = article.domain || source.domain;

              return {
                source,
                sourceName: sourceNameFromDomain(domain, article.sourceCommonName || source.name),
                sourceDomain: domain,
                providerName: this.name,
                providerQuery: query,
                discoveryLayer: "source" as const,
                matchedQuery: query,
                targetEntityIds: [source.id],
                targetEntityNames: [source.name],
                originalTitle: cleanHtmlToText(article.title || ""),
                originalUrl: normalizeUrl(article.url || source.homepageUrl),
                publishedAt: parseDate(article.seendate) || new Date(),
                rawDescription: trimText(cleanHtmlToText(article.snippet || ""), 800),
                contentSnippet: trimText(cleanHtmlToText(article.snippet || article.title || ""), 800)
              };
            });

          candidates.push(...articles);
          logs.push(
            buildProviderLog({
              providerName: this.name,
              query,
              status: "success",
              totalFetched: articles.length
            })
          );
        } catch (error) {
          logs.push(
            buildProviderLog({
              providerName: this.name,
              query,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Source coverage fetch failed"
            })
          );
        }
      }
    }

    return {
      candidates,
      logs
    };
  }
}
