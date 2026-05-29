import type { ContentSource } from "@/config/content-sources";
import type { SourceConfig } from "@/config/sources";
import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import { buildProviderLog, fetchText, getSourceDomain, runWithConcurrency } from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";

const EXCLUDED_LINK_TEXT = [
  "about",
  "contact",
  "donate",
  "home",
  "privacy",
  "resource hub",
  "search",
  "subscribe",
  "terms"
];

function decodeHref(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function toAbsoluteUrl(href: string, pageUrl: string): string | null {
  try {
    return normalizeUrl(new URL(decodeHref(href), pageUrl).toString());
  } catch {
    return null;
  }
}

function extractDate(text: string): Date | null {
  const match = text.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},\s+\d{4}\b/i
  );

  return match ? parseDate(match[0]) : null;
}

function isSameSourceDomain(url: string, source: SourceConfig | ContentSource): boolean {
  const sourceDomain = getSourceDomain(source.homepageUrl);
  const linkDomain = getSourceDomain(url);

  return linkDomain === sourceDomain || linkDomain.endsWith(`.${sourceDomain}`);
}

function isLikelyContentLink(source: SourceConfig | ContentSource, url: string, text: string, pageUrl: string): boolean {
  if (!isSameSourceDomain(url, source) || url === pageUrl) {
    return false;
  }

  const title = cleanHtmlToText(text);
  const lowerTitle = title.toLowerCase();

  if (title.length < 24 || EXCLUDED_LINK_TEXT.some((item) => lowerTitle === item || lowerTitle.includes(` ${item} `))) {
    return false;
  }

  try {
    const pathName = new URL(url).pathname;
    const fallbackUrls = ("fallbackPageUrls" in source ? source.fallbackPageUrls : (source as ContentSource).indexPageUrls) || [];
    const fallbackPaths = new Set(fallbackUrls.map((item) => new URL(item).pathname));

    if (fallbackPaths.has(pathName) || pathName === "/" || /\.(jpg|jpeg|png|gif|webp|svg|mp4|zip)$/i.test(pathName)) {
      return false;
    }

    if (source.id === "america-first-policy-institute") {
      return pathName.startsWith("/issues/") && pathName !== "/issues/";
    }

    if (source.id === "axios") {
      return /^\/\d{4}\//.test(pathName);
    }

    if (source.id === "washington-post-politics") {
      return /\/\d{4}\/\d{2}\/\d{2}\//.test(pathName);
    }

    if (source.id === "foreign-affairs") {
      return !pathName.endsWith("/rss.xml") && pathName.split("/").filter(Boolean).length >= 2;
    }

    if (source.id === "national-security-action") {
      return !pathName.endsWith("-main") && pathName.split("/").filter(Boolean).length >= 1;
    }

    return true;
  } catch {
    return false;
  }
}

function extractPageCandidates(source: SourceConfig | ContentSource, pageUrl: string, html: string) {
  const sourceDomain = getSourceDomain(source.homepageUrl);
  const candidates: ProviderFetchResult["candidates"] = [];
  const seenUrls = new Set<string>();
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html))) {
    const url = toAbsoluteUrl(match[1], pageUrl);
    const linkText = cleanHtmlToText(match[2]);

    if (!url || seenUrls.has(url) || !isLikelyContentLink(source, url, linkText, pageUrl)) {
      continue;
    }

    const trailingHtml = html.slice(linkPattern.lastIndex, linkPattern.lastIndex + 650);
    const snippet = trimText(cleanHtmlToText(`${linkText}. ${trailingHtml}`), 800);
    const publishedAt = extractDate(snippet) || new Date();

    seenUrls.add(url);
    candidates.push({
      source,
      sourceName: source.name,
      sourceDomain,
      providerName: "PublicPageProvider",
      providerQuery: `${source.id} ${pageUrl}`,
      originalTitle: trimText(linkText, 220),
      originalUrl: url,
      publishedAt,
      rawDescription: snippet,
      contentSnippet: snippet
    });
  }

  return candidates.slice(0, source.maxItemsPerRun || 12);
}

export class PublicPageProvider implements NewsProvider {
  name = "PublicPageProvider";

  async fetch(discoveryJobs: Parameters<NewsProvider["fetch"]>[0]): Promise<ProviderFetchResult> {
    const jobs = discoveryJobs.filter((job) => job.method === "public-page" && job.source && job.url);
    const results = await runWithConcurrency(jobs, 4, async (job) => {
        const source = job.source!;
        const pageUrl = job.url!;
        const query = job.query;

        try {
          const html = await fetchText(pageUrl, 10000);
          const parsed = extractPageCandidates(source, pageUrl, html).map((candidate) => ({
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
            candidates: parsed,
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "success",
              totalFetched: parsed.length
            })
          };
        } catch (error) {
          return {
            candidates: [],
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Public page fetch failed"
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
