import {
  PRIMARY_SOURCES,
  getContentSourcesForPrimary,
  getPrimarySourceNames,
  normalizeSourceDomain
} from "@/config/primary-sources";
import { getAllStoredArticles } from "@/lib/data/articleStore";
import { getDataPath, listJsonDates, readJsonFile, writeJsonFile } from "@/lib/data/jsonStore";
import type { DailyRunLog, StoredArticle } from "@/lib/news/types";

export function getRunLogFilePath(dateKey: string): string {
  return getDataPath("runs", `${dateKey}.json`);
}

export async function writeRunLog(dateKey: string, runLog: DailyRunLog): Promise<void> {
  await writeJsonFile(getRunLogFilePath(dateKey), runLog);
}

export async function getRecentRuns(): Promise<DailyRunLog[]> {
  const dates = await listJsonDates("runs");
  const logs = await Promise.all(dates.slice(0, 12).map((date) => readJsonFile<DailyRunLog | null>(getRunLogFilePath(date), null)));
  return logs.filter((log): log is DailyRunLog => Boolean(log));
}

export async function getSourceStatus() {
  const [articles, runs] = await Promise.all([getAllStoredArticles(), getRecentRuns()]);
  const latestRun = runs[0];
  const indexedProviders = new Set(["GoogleNewsRssProvider", "GdeltProvider"]);

  return PRIMARY_SOURCES.map((source) => {
    const configuredSources = getContentSourcesForPrimary(source);
    const sourceNames = getPrimarySourceNames(source).map((name) => name.toLowerCase());
    const sourceDomains = Array.from(
      new Set([source.domain, ...configuredSources.map((item) => item.domain)].map(normalizeSourceDomain))
    );
    const sourceArticles = articles.filter(
      (article) =>
        sourceNames.includes(article.sourceName.toLowerCase()) ||
        sourceDomains.includes(normalizeSourceDomain(article.sourceDomain))
    );
    const directSourceHits = sourceArticles.filter((article) => !indexedProviders.has(article.providerName)).length;
    const indexedSourceHits = sourceArticles.filter((article) => indexedProviders.has(article.providerName)).length;
    const relatedArticles = articles.filter((article: StoredArticle) => {
      const tags = [...(article.relatedOrganizationTags || []), ...(article.relatedEntityTags || [])];
      const isSameSource =
        sourceNames.includes(article.sourceName.toLowerCase()) ||
        sourceDomains.includes(normalizeSourceDomain(article.sourceDomain));
      return (
        !isSameSource &&
        tags.some((tag) => {
          const normalizedTag = tag.toLowerCase();
          return sourceNames.includes(normalizedTag) || sourceDomains.includes(normalizeSourceDomain(normalizedTag));
        })
      );
    });
    const providerLogs = latestRun?.providerLogs.filter((log) =>
      log.query.includes(source.id) ||
      sourceNames.some((name) => log.query.toLowerCase().includes(name)) ||
      sourceDomains.some((domain) => log.query.toLowerCase().includes(domain))
    ) || [];
    const failed = providerLogs.filter((log) => log.status === "failed");
    const fetched = providerLogs.reduce((sum, log) => sum + log.totalFetched, 0);
    const coverageCount = directSourceHits + indexedSourceHits + relatedArticles.length;
    const enabled = configuredSources.some((item) => item.enabled);
    const firstConfiguredSource = configuredSources[0];

    return {
      id: source.id,
      name: source.name,
      type: source.type,
      homepageUrl: source.homepageUrl,
      domain: source.domain,
      rssUrl: firstConfiguredSource?.rssUrls[0] || null,
      enabled,
      notes: firstConfiguredSource?.notes || null,
      lastFetchedAt: latestRun ? new Date(latestRun.endedAt) : null,
      lastFetchStatus: providerLogs.length
        ? failed.length === providerLogs.length
          ? "failed"
          : "success"
        : coverageCount > 0
          ? "success"
          : "未运行",
      lastFetchMessage:
        relatedArticles.length > 0 && directSourceHits + indexedSourceHits === 0
          ? "covered by related entity discovery"
          : failed[0]?.errorMessage || firstConfiguredSource?.notes || firstConfiguredSource?.rssUrls[0] || "公开来源",
      lastItemCount: fetched || coverageCount,
      savedCount: sourceArticles.length,
      directSourceHits,
      indexedSourceHits,
      relatedEntityHits: relatedArticles.length,
      coverageStatus:
        directSourceHits > 0
          ? "direct"
          : indexedSourceHits > 0
            ? "indexed"
            : relatedArticles.length > 0
              ? "related"
              : "none"
    };
  });
}
