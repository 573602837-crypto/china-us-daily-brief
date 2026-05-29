const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "about",
  "after",
  "before",
  "have",
  "has",
  "will",
  "their",
  "they",
  "them",
  "over",
  "under",
  "amid",
  "says",
  "said",
  "news",
  "live",
  "update",
  "updates"
]);

export function cleanHtmlToText(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\"")
    .replace(/&ldquo;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimText(input: string, maxLength: number): string {
  const text = input.replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function normalizeQuotes(input: string): string {
  return input
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }

    return url.toString();
  } catch {
    return input.trim();
  }
}

export function normalizeTokens(input: string): string[] {
  return normalizeQuotes(input)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function buildTitleFingerprint(title: string, sourceName: string, dateKey: string): string {
  const tokens = Array.from(new Set(normalizeTokens(title))).slice(0, 12);
  return `${sourceName.toLowerCase()}-${dateKey}-${tokens.join("-")}`;
}

export function buildStableHash(input: string): string {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function countKeywordHits(text: string, keywords: string[]): number {
  const normalized = normalizeQuotes(text).toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
}

export function includesKeyword(text: string, keywords: string[]): boolean {
  return countKeywordHits(text, keywords) > 0;
}

export function extractContext(text: string, startIndex: number, length: number): string {
  const start = Math.max(0, startIndex - 90);
  const end = Math.min(text.length, startIndex + length + 90);
  return trimText(text.slice(start, end), 220);
}

export function formatDateKey(value: Date, timezone = "Asia/Shanghai"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

export function parseDate(input: unknown): Date | null {
  if (!input) {
    return null;
  }

  const parsed = new Date(String(input));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function getShanghaiDateRange(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
