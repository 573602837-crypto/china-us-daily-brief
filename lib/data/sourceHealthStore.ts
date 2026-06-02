import {
  PRIMARY_SOURCES,
  getContentSourcesForPrimary,
  getPrimarySourceNames,
  normalizeSourceDomain
} from "@/config/primary-sources";
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

function sourceMatchesArticle(sourceNames: string[], sourceDomains: string[], article: StoredArticle): boolean {
  return (
    sourceNames.includes(article.sourceName.toLowerCase()) ||
    sourceDomains.includes(normalizeSourceDomain(article.sourceDomain))
  );
}

function sourceRelatedToArticle(sourceNames: string[], sourceDomains: string[], article: StoredArticle): boolean {
  if (sourceMatchesArticle(sourceNames, sourceDomains, article)) {
    return false;
  }

  const tags = [...(article.relatedOrganizationTags || []), ...(article.relatedEntityTags || [])];

  return tags.some((tag) => {
    const normalizedTag = tag.toLowerCase();
    return sourceNames.includes(normalizedTag) || sourceDomains.includes(normalizeSourceDomain(normalizedTag));
  });
}

function logMatchesSource(logQuery: string, sourceId: string, sourceNames: string[], sourceDomains: string[]): boolean {
  const normalizedQuery = logQuery.toLowerCase();

  return (
    logQuery.includes(sourceId) ||
    sourceNames.some((name) => normalizedQuery.includes(name)) ||
    sourceDomains.some((domain) => normalizedQuery.includes(domain))
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
  const entries = PRIMARY_SOURCES.map((source) => {
    const configuredSources = getContentSourcesForPrimary(source);
    const sourceNames = getPrimarySourceNames(source).map((name) => name.toLowerCase());
    const sourceDomains = Array.from(
      new Set([source.domain, ...configuredSources.map((item) => item.domain)].map(normalizeSourceDomain))
    );
    const sourceArticles = articles.filter((article) => sourceMatchesArticle(sourceNames, sourceDomains, article));
    const relatedArticles = articles.filter((article) => sourceRelatedToArticle(sourceNames, sourceDomains, article));
    const directSourceHits = sourceArticles.filter((article) => !INDEXED_PROVIDERS.has(article.providerName)).length;
    const indexedSourceHits = sourceArticles.filter((article) => INDEXED_PROVIDERS.has(article.providerName)).length;
    const providerLogs = runLog.providerLogs.filter((log) =>
      logMatchesSource(log.query, source.id, sourceNames, sourceDomains)
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
      enabled: configuredSources.some((item) => item.enabled),
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
          : providerLogs.find((log) => log.status === "failed")?.errorMessage ||
            configuredSources.find((item) => item.notes)?.notes ||
            "公开来源"
    };
  });

  await writeJsonFile(getSourceHealthFilePath(dateKey), {
    runDate: dateKey,
    generatedAt: new Date().toISOString(),
    entries
  });
}
