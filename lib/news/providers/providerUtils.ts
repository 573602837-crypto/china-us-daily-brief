import { XMLParser } from "fast-xml-parser";

import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: true
});

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 ChinaUSDailyBriefBot/0.1";

export function getSourceDomain(input: string): string {
  try {
    return new URL(input).hostname.replace(/^www\./, "");
  } catch {
    return input.replace(/^www\./, "");
  }
}

export async function fetchText(url: string, timeoutMs = 16000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7"
    },
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
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

function pickAtomLink(value: unknown): string {
  return (
    ensureArray(value as Record<string, unknown>[])
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return String(item.href || item.url || "");
      })
      .find(Boolean) || ""
  );
}

export function cleanSourceTitle(sourceName: string, title: string): string {
  return title
    .replace(new RegExp(`\\s+-\\s+${sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "")
    .replace(/\s+-\s+The New York Times$/i, "")
    .replace(/\s+-\s+The Washington Post$/i, "")
    .replace(/\s+-\s+CNN$/i, "")
    .replace(/\s+-\s+Axios$/i, "")
    .trim();
}

export function parseRssOrAtom(params: {
  xml: string;
  sourceName: string;
  sourceDomain: string;
  providerName: string;
  providerQuery?: string;
  fallbackUrl: string;
}) {
  const parsed = xmlParser.parse(params.xml) as Record<string, unknown>;
  const items: Array<Record<string, unknown>> = [];

  if (parsed.rss) {
    const rss = parsed.rss as Record<string, unknown>;
    const channel = rss.channel as Record<string, unknown> | undefined;
    items.push(...ensureArray(channel?.item as Record<string, unknown> | Record<string, unknown>[]));
  } else if (parsed.feed) {
    const feed = parsed.feed as Record<string, unknown>;
    items.push(...ensureArray(feed.entry as Record<string, unknown> | Record<string, unknown>[]));
  }

  return items.flatMap((item) => {
    const isAtom = Boolean((parsed.feed as Record<string, unknown> | undefined)?.entry);
    const rawTitle = cleanHtmlToText(valueToString(item.title));
    const originalTitle = cleanSourceTitle(params.sourceName, rawTitle);
    const originalUrl = normalizeUrl(
      isAtom ? pickAtomLink(item.link) || params.fallbackUrl : valueToString(item.link || item.guid || params.fallbackUrl)
    );
    const rawDescription = cleanHtmlToText(
      valueToString(item.description || item["content:encoded"] || item.summary || item.content || "")
    );
    const publishedAt =
      parseDate(item.pubDate || item.published || item.updated || item.created || item.date) || new Date();
    const authorValue = item.author as Record<string, unknown> | undefined;
    const author = cleanHtmlToText(valueToString(authorValue?.name || item.author || item["dc:creator"]));

    if (!originalTitle || !originalUrl) {
      return [];
    }

    return [
      {
        sourceName: params.sourceName,
        sourceDomain: params.sourceDomain,
        providerName: params.providerName,
        providerQuery: params.providerQuery,
        originalTitle,
        originalUrl,
        publishedAt,
        author: author || undefined,
        rawDescription: trimText(rawDescription, 800),
        contentSnippet: trimText(rawDescription || originalTitle, 800)
      }
    ];
  });
}

export function buildOrQuery(terms: string[]): string {
  return terms
    .map((term) => (/\s/.test(term) ? `"${term}"` : term))
    .join(" OR ");
}

export function buildProviderLog(params: {
  providerName: string;
  query: string;
  status: "success" | "failed";
  errorMessage?: string;
  totalFetched?: number;
  totalSaved?: number;
  totalSkipped?: number;
}) {
  return {
    providerName: params.providerName,
    query: params.query,
    status: params.status,
    errorMessage: params.errorMessage,
    totalFetched: params.totalFetched || 0,
    totalSaved: params.totalSaved || 0,
    totalSkipped: params.totalSkipped || 0
  };
}

export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
}
