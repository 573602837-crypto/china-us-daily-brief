import { CONTENT_SOURCES } from "@/config/content-sources";
import { getDataPath, writeJsonFile } from "@/lib/data/jsonStore";
import type { DailyRunLog, StoredArticle } from "@/lib/news/types";

const INDEXED_PROVIDERS = new Set(["GoogleNewsRssProvider", "GdeltProvider"]);

export type SourceHealthEntry = {
  id: string;
  name: string;
  domain: string;
  type: string;
  enabled: boolean;
  directSourceHits: number;
  indexedSourceHits: number;
  relatedEntityHits: number;
  providerFetched: number;
  providerSaved: number;
  providerFailed: number;
  status: "direct" | "indexed" | "related" | "failed" | "none";
  message: string;
};

export type SourceHealthLog = {
  runDate: string;
  generatedAt: string;
  entries: SourceHealthEntry[];
};

function sourceMatchesArticle(sourceName: string, sourceDomain: string, article: StoredArticle): boolean {
  return article.sourceName === sourceName || article.sourceDomain === sourceDomain;
}

function sourceRelatedToArticle(sourceName: string, sourceDomain: string, article: StoredArticle): boolean {
  if (sourceMatchesArticle(sourceName, sourceDomain, article)) {
    return false;
  }

  const tags = [...(article.relatedOrganizationTags || []), ...(article.relatedEntityTags || [])];
  const normalizedName = sourceName.toLowerCase();
  const normalizedDomain = sourceDomain.toLowerCase();

  return tags.some((tag) => {
    const normalizedTag = tag.toLowerCase();
    return normalizedTag === normalizedName || normalizedTag === normalizedDomain;
  });
}

function logMatchesSource(logQuery: string, sourceId: string, sourceName: string, sourceDomain: string): boolean {
  return (
    logQuery.includes(sourceId) ||
    logQuery.includes(sourceName) ||
    logQuery.includes(sourceDomain)
  );
}

export function getSourceHealthFilePath(dateKey: string): string {
  return getDataPath("source-health", `${dateKey}.json`);
}

export async function writeSourceHealthLog(
  dateKey: string,
  articles: StoredArticle[],
  runLog: DailyRunLog
): Promise<void> {
  const entries = CONTENT_SOURCES.map((source) => {
    const sourceArticles = articles.filter((article) => sourceMatchesArticle(source.name, source.domain, article));
    const relatedArticles = articles.filter((article) => sourceRelatedToArticle(source.name, source.domain, article));
    const directSourceHits = sourceArticles.filter((article) => !INDEXED_PROVIDERS.has(article.providerName)).length;
    const indexedSourceHits = sourceArticles.filter((article) => INDEXED_PROVIDERS.has(article.providerName)).length;
    const providerLogs = runLog.providerLogs.filter((log) =>
      logMatchesSource(log.query, source.id, source.name, source.domain)
    );
    const providerFailed = providerLogs.filter((log) => log.status === "failed").length;
    const providerFetched = providerLogs.reduce((sum, log) => sum + log.totalFetched, 0);
    const providerSaved = providerLogs.reduce((sum, log) => sum + log.totalSaved, 0);
    const status: SourceHealthEntry["status"] =
      directSourceHits > 0
        ? "direct"
        : indexedSourceHits > 0
          ? "indexed"
          : relatedArticles.length > 0
            ? "related"
            : providerLogs.length > 0 && providerFailed === providerLogs.length
              ? "failed"
              : "none";

    return {
      id: source.id,
      name: source.name,
      domain: source.domain,
      type: source.type,
      enabled: source.enabled,
      directSourceHits,
      indexedSourceHits,
      relatedEntityHits: relatedArticles.length,
      providerFetched,
      providerSaved,
      providerFailed,
      status,
      message:
        status === "related"
          ? "covered by related entity discovery"
          : providerLogs.find((log) => log.status === "failed")?.errorMessage || source.notes || "公开来源"
    };
  });

  await writeJsonFile(getSourceHealthFilePath(dateKey), {
    runDate: dateKey,
    generatedAt: new Date().toISOString(),
    entries
  });
}
