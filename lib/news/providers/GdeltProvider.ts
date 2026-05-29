import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import { buildOrQuery, buildProviderLog, fetchText, runWithConcurrency } from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  sourceCommonName?: string;
  domain?: string;
  language?: string;
  snippet?: string;
};

function sourceNameFromDomain(domain: string, fallback?: string): string {
  const known: Record<string, string> = {
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
    "americafirstpolicy.com": "America First Policy Institute"
  };

  return known[domain] || fallback || domain;
}

function buildGdeltUrl(query: string): string {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: "20",
    sort: "hybridrel",
    timespan: "3d"
  });

  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGdeltJson(url: string): Promise<string> {
  try {
    return await fetchText(url, 9000);
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP 429")) {
      await wait(1500);
      return fetchText(url, 12000);
    }

    throw error;
  }
}

export class GdeltProvider implements NewsProvider {
  name = "GdeltProvider";

  async fetch(discoveryJobs: DiscoveryJob[]): Promise<ProviderFetchResult> {
    const jobs = discoveryJobs.filter((job) => job.method === "gdelt");
    const results = await runWithConcurrency(jobs, 2, async (job) => {
        const query = job.query;

        try {
          const json = await fetchGdeltJson(buildGdeltUrl(query));
          const parsed = JSON.parse(json) as { articles?: GdeltArticle[] };
          const articles = (parsed.articles || [])
            .filter((article) => article.url && article.title)
            .slice(0, 12)
            .map((article) => ({
              source: job.source,
              sourceName: sourceNameFromDomain(article.domain || job.sourceDomain || "", article.sourceCommonName || job.sourceName),
              sourceDomain: article.domain || job.sourceDomain || "",
              providerName: this.name,
              providerQuery: job.query,
              discoveryLayer: job.layer,
              matchedQuery: job.query,
              targetEntityIds: job.targetEntityIds,
              targetEntityNames: job.targetEntityNames,
              originalTitle: cleanHtmlToText(article.title || ""),
              originalUrl: normalizeUrl(article.url || `https://${domain}`),
              publishedAt: parseDate(article.seendate) || new Date(),
              rawDescription: trimText(cleanHtmlToText(article.snippet || ""), 800),
              contentSnippet: trimText(cleanHtmlToText(article.snippet || article.title || ""), 800)
            }));

          return {
            candidates: articles,
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "success",
              totalFetched: articles.length
            })
          };
        } catch (error) {
          return {
            candidates: [],
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "GDELT fetch failed"
            })
          };
        }
    });

    return {
      candidates: results.flatMap((result) => result.candidates),
      logs: results.map((result) => result.log)
    };
  }
}
