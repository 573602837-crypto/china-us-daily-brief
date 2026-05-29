import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import {
  buildProviderLog,
  cleanSourceTitle,
  fetchText,
  getSourceDomain,
  runWithConcurrency
} from "@/lib/news/providers/providerUtils";
import { xmlParser } from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

function buildGoogleNewsUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });

  return `https://news.google.com/rss/search?${params.toString()}`;
}

export class GoogleNewsRssProvider implements NewsProvider {
  name = "GoogleNewsRssProvider";

  async fetch(discoveryJobs: DiscoveryJob[]): Promise<ProviderFetchResult> {
    const jobs = discoveryJobs.filter((job) => job.method === "google-news");
    const results = await runWithConcurrency(jobs, 5, async (job) => {
      const domain = job.sourceDomain || "news.google.com";
      const sourceName = job.sourceName || "Google News RSS";
      const query = job.query;
      const url = buildGoogleNewsUrl(query);

      try {
        const xml = await fetchText(url, 6000);
        const parsed = parseGoogleNewsXml(xml, job, this.name, sourceName, domain).slice(0, 10);

        return {
          candidates: parsed,
          log: buildProviderLog({
            providerName: this.name,
            query: job.query,
            status: "success",
            totalFetched: parsed.length
          })
        };
      } catch (error) {
        return {
          candidates: [],
          log: buildProviderLog({
            providerName: this.name,
            query: job.query,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Google News RSS fetch failed"
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

function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function valueToString(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return valueToString(objectValue["#text"] || objectValue.text || objectValue.href || "");
  }

  return "";
}

function parseGoogleNewsXml(
  xml: string,
  job: DiscoveryJob,
  providerName: string,
  fallbackSourceName: string,
  fallbackDomain: string
) {
  const parsed = xmlParser.parse(xml) as Record<string, unknown>;
  const rss = parsed.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  const items = ensureArray(channel?.item as Record<string, unknown> | Record<string, unknown>[]);

  return items.flatMap((item) => {
    const source = item.source as Record<string, unknown> | string | undefined;
    const sourceName = cleanHtmlToText(valueToString(source) || fallbackSourceName);
    const sourceUrl = typeof source === "object" ? valueToString(source.url) : "";
    const sourceDomain = sourceUrl ? getSourceDomain(sourceUrl) : fallbackDomain;
    const rawTitle = cleanHtmlToText(valueToString(item.title));
    const originalTitle = cleanSourceTitle(sourceName, rawTitle);
    const originalUrl = normalizeUrl(valueToString(item.link || item.guid || sourceUrl || `https://${sourceDomain}`));
    const rawDescription = trimText(cleanHtmlToText(valueToString(item.description || "")), 800);
    const publishedAt = parseDate(item.pubDate) || new Date();

    if (!originalTitle || !originalUrl) {
      return [];
    }

    return [
      {
        source: job.source,
        sourceName,
        sourceDomain,
        providerName,
        providerQuery: job.query,
        discoveryLayer: job.layer,
        matchedQuery: job.query,
        targetEntityIds: job.targetEntityIds,
        targetEntityNames: job.targetEntityNames,
        originalTitle,
        originalUrl,
        publishedAt,
        rawDescription,
        contentSnippet: rawDescription || originalTitle
      }
    ];
  });
}
