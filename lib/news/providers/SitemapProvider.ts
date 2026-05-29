import type { ContentSource } from "@/config/content-sources";
import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import {
  buildProviderLog,
  fetchText,
  getSourceDomain,
  runWithConcurrency,
  xmlParser
} from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";

type XmlObject = Record<string, unknown>;

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
    const objectValue = value as XmlObject;
    return valueToString(objectValue["#text"] || objectValue.text || objectValue.loc || "");
  }

  return "";
}

function titleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const lastPart = path
      .split("/")
      .filter(Boolean)
      .pop();

    return cleanHtmlToText(
      (lastPart || path)
        .replace(/-\d+$/g, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  } catch {
    return cleanHtmlToText(url);
  }
}

function extractNewsTitle(item: XmlObject): string {
  const news = item["news:news"] as XmlObject | undefined;
  const publication = news?.["news:publication"] as XmlObject | undefined;
  return cleanHtmlToText(
    valueToString(
      item["news:title"] ||
        news?.["news:title"] ||
        item.title ||
        item["image:title"] ||
        publication?.["news:name"]
    )
  );
}

function isSameSourceDomain(url: string, source: ContentSource): boolean {
  const sourceDomain = getSourceDomain(source.homepageUrl);
  const linkDomain = getSourceDomain(url);

  return linkDomain === sourceDomain || linkDomain.endsWith(`.${sourceDomain}`);
}

function isLikelyArticleUrl(source: ContentSource, url: string): boolean {
  if (!isSameSourceDomain(url, source)) {
    return false;
  }

  try {
    const pathName = new URL(url).pathname;

    if (pathName === "/" || /\.(jpg|jpeg|png|gif|webp|svg|mp4|zip|pdf)$/i.test(pathName)) {
      return false;
    }

    if (source.id === "axios") {
      return /^\/\d{4}\//.test(pathName);
    }

    if (source.id === "washington-post-politics") {
      return /\/\d{4}\/\d{2}\/\d{2}\//.test(pathName);
    }

    if (source.id === "america-first-policy-institute") {
      return pathName.startsWith("/issues/") && pathName !== "/issues/";
    }

    if (source.id === "national-security-action") {
      return !pathName.endsWith("-main") && pathName.split("/").filter(Boolean).length >= 1;
    }

    if (source.id === "foreign-affairs") {
      return pathName.split("/").filter(Boolean).length >= 2;
    }

    return true;
  } catch {
    return false;
  }
}

function parseSitemapUrls(source: ContentSource, sitemapUrl: string, xml: string) {
  const parsed = xmlParser.parse(xml) as XmlObject;
  const sourceDomain = getSourceDomain(source.homepageUrl);
  const urlset = parsed.urlset as XmlObject | undefined;
  const entries = ensureArray(urlset?.url as XmlObject | XmlObject[]);

  return entries
    .map((entry) => {
      const originalUrl = normalizeUrl(valueToString(entry.loc));
      const newsTitle = extractNewsTitle(entry);
      const title = trimText(newsTitle || titleFromUrl(originalUrl), 220);
      const lastmod = parseDate(entry.lastmod);
      const snippet = `公开 sitemap 条目：${title}`;

      return {
        source,
        sourceName: source.name,
        sourceDomain,
        providerName: "SitemapProvider",
        providerQuery: `${source.id} ${sitemapUrl}`,
        originalTitle: title,
        originalUrl,
        publishedAt: lastmod || new Date(),
        rawDescription: snippet,
        contentSnippet: snippet
      };
    })
    .filter((candidate) => candidate.originalTitle && isLikelyArticleUrl(source, candidate.originalUrl))
    .slice(0, source.maxItemsPerRun || 16);
}

function parseSitemapIndex(xml: string): string[] {
  const parsed = xmlParser.parse(xml) as XmlObject;
  const sitemapIndex = parsed.sitemapindex as XmlObject | undefined;
  const entries = ensureArray(sitemapIndex?.sitemap as XmlObject | XmlObject[]);

  return entries
    .map((entry) => valueToString((entry as XmlObject).loc))
    .filter(Boolean)
    .filter((url) => /news|post|article|sitemap/i.test(url))
    .slice(0, 8);
}

function parseRobotsSitemaps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export class SitemapProvider implements NewsProvider {
  name = "SitemapProvider";

  async fetch(discoveryJobs: Parameters<NewsProvider["fetch"]>[0]): Promise<ProviderFetchResult> {
    const sitemapJobs = discoveryJobs.filter(
      (job) => (job.method === "sitemap" || job.method === "robots-sitemap") && job.source && job.url
    );

    const results = await runWithConcurrency(sitemapJobs, 3, async (job) => {
      const source = job.source!;
      const sitemapUrl = job.url!;
      const query = job.query;

      try {
        const firstText = await fetchText(sitemapUrl, 8000);
        const sitemapUrls = job.method === "robots-sitemap" ? parseRobotsSitemaps(firstText) : [sitemapUrl];
        const xml = job.method === "robots-sitemap" ? "" : firstText;
        const directSitemapUrls = job.method === "robots-sitemap" ? sitemapUrls : [];
        const rootResults = xml ? parseSitemapUrls(source, sitemapUrl, xml) : [];
        const rootChildSitemaps = xml ? parseSitemapIndex(xml) : [];
        const childSitemapsFromRobots = directSitemapUrls;
        const allChildSitemaps = [...rootChildSitemaps, ...childSitemapsFromRobots].slice(0, 10);

        if (allChildSitemaps.length > 0) {
          const childResults = await runWithConcurrency(allChildSitemaps, 3, async (childUrl) => {
            try {
              const childXml = await fetchText(childUrl, 8000);
              return parseSitemapUrls(source, childUrl, childXml);
            } catch {
              return [];
            }
          });
          const candidates = [...rootResults, ...childResults.flat()]
            .slice(0, source.maxItemsPerRun || 16)
            .map((candidate) => ({
              ...candidate,
              source,
              sourceName: job.sourceName || candidate.sourceName,
              sourceDomain: job.sourceDomain || candidate.sourceDomain,
              discoveryLayer: job.layer,
              matchedQuery: job.query,
              targetEntityIds: job.targetEntityIds,
              targetEntityNames: job.targetEntityNames
            }));

          return {
            candidates,
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "success",
              totalFetched: candidates.length
            })
          };
        }

        const candidates = rootResults
          .slice(0, source.maxItemsPerRun || 16)
          .map((candidate) => ({
            ...candidate,
            source,
            sourceName: job.sourceName || candidate.sourceName,
            sourceDomain: job.sourceDomain || candidate.sourceDomain,
            discoveryLayer: job.layer,
            matchedQuery: job.query,
            targetEntityIds: job.targetEntityIds,
            targetEntityNames: job.targetEntityNames
          }));
        return {
          candidates,
          log: buildProviderLog({
            providerName: this.name,
            query,
            status: "success",
            totalFetched: candidates.length
          })
        };
      } catch (error) {
        return {
          candidates: [],
          log: buildProviderLog({
            providerName: this.name,
            query,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Sitemap fetch failed"
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
