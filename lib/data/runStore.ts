import { SOURCES } from "@/config/sources";
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

  return SOURCES.map((source) => {
    const sourceArticles = articles.filter(
      (article) => article.sourceName === source.name || article.sourceDomain === new URL(source.homepageUrl).hostname.replace(/^www\./, "")
    );
    const providerLogs = latestRun?.providerLogs.filter((log) =>
      log.query.includes(source.id) ||
      log.query.includes(source.name) ||
      log.query.includes(new URL(source.homepageUrl).hostname.replace(/^www\./, ""))
    ) || [];
    const failed = providerLogs.filter((log) => log.status === "failed");
    const fetched = providerLogs.reduce((sum, log) => sum + log.totalFetched, 0);

    return {
      id: source.id,
      name: source.name,
      type: source.type,
      homepageUrl: source.homepageUrl,
      rssUrl: source.rssUrl || null,
      enabled: source.enabled,
      notes: source.notes || null,
      lastFetchedAt: latestRun ? new Date(latestRun.endedAt) : null,
      lastFetchStatus: providerLogs.length
        ? failed.length === providerLogs.length
          ? "failed"
          : "success"
        : "未运行",
      lastFetchMessage: failed[0]?.errorMessage || source.notes || source.rssUrl || "公开来源",
      lastItemCount: fetched || sourceArticles.length,
      savedCount: sourceArticles.length
    };
  });
}
