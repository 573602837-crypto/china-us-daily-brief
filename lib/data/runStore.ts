import { CONTENT_SOURCES } from "@/config/content-sources";
import { getAllStoredArticles } from "@/lib/data/articleStore";
import { getDataPath, listJsonDates, readJsonFile, writeJsonFile } from "@/lib/data/jsonStore";
import type { DailyRunLog } from "@/lib/news/types";

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

  return CONTENT_SOURCES.map((source) => {
    const sourceArticles = articles.filter(
      (article) => article.sourceName === source.name || article.sourceDomain === source.domain
    );
    const directSourceHits = sourceArticles.filter((article) => !indexedProviders.has(article.providerName)).length;
    const indexedSourceHits = sourceArticles.filter((article) => indexedProviders.has(article.providerName)).length;
    const relatedArticles = articles.filter((article) => {
      const tags = [...(article.relatedOrganizationTags || []), ...(article.relatedEntityTags || [])];
      const isSameSource = article.sourceName === source.name || article.sourceDomain === source.domain;
      return !isSameSource && tags.some((tag) => tag.toLowerCase() === source.name.toLowerCase());
    });
    const providerLogs = latestRun?.providerLogs.filter((log) =>
      log.query.includes(source.id) ||
      log.query.includes(source.name) ||
      log.query.includes(source.domain)
    ) || [];
    const failed = providerLogs.filter((log) => log.status === "failed");
    const fetched = providerLogs.reduce((sum, log) => sum + log.totalFetched, 0);
    const coverageCount = directSourceHits + indexedSourceHits + relatedArticles.length;

    return {
      id: source.id,
      name: source.name,
      type: source.type,
      homepageUrl: source.homepageUrl,
      rssUrl: source.rssUrls[0] || null,
      enabled: source.enabled,
      notes: source.notes || null,
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
          : failed[0]?.errorMessage || source.notes || source.rssUrls[0] || "公开来源",
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
