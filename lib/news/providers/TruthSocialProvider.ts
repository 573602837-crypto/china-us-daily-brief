import { CONTENT_SOURCES } from "@/config/content-sources";
import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import { buildProviderLog } from "@/lib/news/providers/providerUtils";
import { cleanHtmlToText, normalizeUrl, parseDate, trimText } from "@/lib/news/text";

type TruthSocialAccount = {
  id?: string;
  acct?: string;
  username?: string;
  display_name?: string;
  url?: string;
};

type TruthSocialStatus = {
  id?: string;
  url?: string;
  uri?: string;
  created_at?: string;
  content?: string;
  account?: TruthSocialAccount;
  reblog?: TruthSocialStatus | null;
};

const ACCOUNT = "realDonaldTrump";
const FALLBACK_ACCOUNT_ID = "107780257626128497";
const SOURCE = CONTENT_SOURCES.find((source) => source.id === "truth-social");

function statusUrl(accountId: string): string {
  const params = new URLSearchParams({
    exclude_replies: "true",
    only_media: "false",
    limit: "20"
  });

  return `https://truthsocial.com/api/v1/accounts/${accountId}/statuses?${params.toString()}`;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ChinaUSDailyBriefBot/0.1"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveAccountId(): Promise<string> {
  try {
    const account = await fetchJson<TruthSocialAccount>(
      `https://truthsocial.com/api/v1/accounts/lookup?acct=${ACCOUNT}`,
      6000
    );
    return account.id || FALLBACK_ACCOUNT_ID;
  } catch {
    return FALLBACK_ACCOUNT_ID;
  }
}

function titleFromStatus(text: string): string {
  const firstSentence = text.split(/(?<=[.!?。！？])\s+/)[0] || text;
  return trimText(firstSentence || "Truth Social post by Donald Trump", 160);
}

export class TruthSocialProvider implements NewsProvider {
  name = "TruthSocialProvider";

  async fetch(): Promise<ProviderFetchResult> {
    if (!SOURCE?.enabled) {
      return {
        candidates: [],
        logs: [
          buildProviderLog({
            providerName: this.name,
            query: "truth-social disabled",
            status: "success",
            totalFetched: 0
          })
        ]
      };
    }

    const query = `truth-social @${ACCOUNT}`;

    try {
      const accountId = await resolveAccountId();
      const statuses = await fetchJson<TruthSocialStatus[]>(statusUrl(accountId), 10000);
      const candidates = statuses
        .map((status) => status.reblog || status)
        .map((status) => {
          const text = trimText(cleanHtmlToText(status.content || ""), 900);
          const originalUrl = normalizeUrl(status.url || status.uri || `https://truthsocial.com/@${ACCOUNT}/${status.id || ""}`);

          return {
            source: SOURCE,
            sourceName: SOURCE.name,
            sourceDomain: SOURCE.domain,
            providerName: this.name,
            providerQuery: query,
            discoveryLayer: "source" as const,
            matchedQuery: query,
            targetEntityIds: ["truth-social", "donald-trump"],
            targetEntityNames: ["Truth Social", "Donald Trump"],
            originalTitle: titleFromStatus(text),
            originalUrl,
            publishedAt: parseDate(status.created_at) || new Date(),
            author: status.account?.display_name || "Donald Trump",
            rawDescription: text,
            contentSnippet: text
          };
        })
        .filter((candidate) => candidate.contentSnippet)
        .slice(0, SOURCE.maxItemsPerRun || 12);

      return {
        candidates,
        logs: [
          buildProviderLog({
            providerName: this.name,
            query,
            status: "success",
            totalFetched: candidates.length
          })
        ]
      };
    } catch (error) {
      return {
        candidates: [],
        logs: [
          buildProviderLog({
            providerName: this.name,
            query,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Truth Social fetch failed"
          })
        ]
      };
    }
  }
}
