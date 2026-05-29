import { readArticlesForDate, writeArticlesForDate, getArticlesFilePath } from "@/lib/data/articleStore";
import { writeRunLog, getRunLogFilePath } from "@/lib/data/runStore";
import { classifyTopics, getCandidateText, isChinaRelated, isRelevantCandidate } from "@/lib/news/classify";
import { scoreImportance } from "@/lib/news/importance";
import { matchPeople } from "@/lib/news/peopleMatcher";
import { getNewsProviders } from "@/lib/news/providers";
import { buildChineseSummary } from "@/lib/news/summarizer";
import {
  buildStableHash,
  buildTitleFingerprint,
  formatDateKey,
  normalizeUrl
} from "@/lib/news/text";
import type {
  DailyRunLog,
  PipelineResult,
  ProcessedArticle,
  ProviderLog,
  RawArticleCandidate,
  StoredArticle
} from "@/lib/news/types";
import { appConfig } from "@/lib/settings";

function toDateKey(value: Date): string {
  return formatDateKey(value, appConfig.timezone);
}

function buildArticleId(url: string): string {
  return `art_${buildStableHash(url)}`;
}

function dedupeKey(candidate: RawArticleCandidate): string {
  return buildTitleFingerprint(
    candidate.originalTitle,
    candidate.sourceName,
    toDateKey(candidate.publishedAt)
  );
}

function toStoredArticle(article: ProcessedArticle): StoredArticle {
  return {
    id: article.id,
    sourceName: article.sourceName,
    sourceDomain: article.sourceDomain,
    providerName: article.providerName,
    originalTitle: article.originalTitle,
    chineseTitle: article.chineseTitle,
    originalUrl: article.originalUrl,
    publishedAt: article.publishedAt.toISOString(),
    fetchedAt: new Date().toISOString(),
    rawDescription: article.rawDescription || "",
    contentSnippet: article.contentSnippet || "",
    summaryZh: article.summaryZh,
    summaryBasis: article.summaryBasis,
    topicTags: article.topicTags,
    peopleTags: article.peopleTags,
    peopleMatches: article.peopleMatches,
    importanceLevel: article.importanceLevel,
    chinaRelated: article.chinaRelated
  };
}

async function processCandidate(candidate: RawArticleCandidate): Promise<ProcessedArticle | null> {
  const normalizedCandidate = {
    ...candidate,
    originalUrl: normalizeUrl(candidate.originalUrl)
  };
  const personMatches = matchPeople(getCandidateText(normalizedCandidate));

  if (!isRelevantCandidate(normalizedCandidate) && personMatches.length === 0) {
    return null;
  }

  const topicTags = classifyTopics(normalizedCandidate, personMatches.length > 0);
  const chinaRelated = isChinaRelated(normalizedCandidate);
  const summary = await buildChineseSummary(normalizedCandidate);
  const peopleTags = Array.from(new Set(personMatches.map((match) => match.nameZh || match.nameEn)));
  const importanceLevel = scoreImportance({
    sourceReliability: normalizedCandidate.source?.reliability || 3,
    topicTags,
    peopleMatches: personMatches,
    chinaRelated
  });

return {
    ...normalizedCandidate,
    ...summary,
    id: buildArticleId(normalizedCandidate.originalUrl),
    topicTags,
    peopleMatches: personMatches,
    peopleTags,
    entityMatches: [],
    relatedOrganizationTags: normalizedCandidate.relatedOrganizationTags ?? [],
    relatedEntityTags: normalizedCandidate.relatedEntityTags ?? [],
    providersSeen: normalizedCandidate.providersSeen ?? [normalizedCandidate.providerName].filter(Boolean),
    discoveryLayers: normalizedCandidate.discoveryLayers ?? [],
    matchedQueries: normalizedCandidate.matchedQueries ?? [],
    importanceLevel,
    chinaRelated,
    titleFingerprint: fingerprintTitle(normalizedCandidate.originalTitle),
  };
}

function mergeProviderLogs(
  logs: ProviderLog[],
  statsByQuery: Map<string, { saved: number; skipped: number }>
): ProviderLog[] {
  return logs.map((log) => {
    const stats = statsByQuery.get(`${log.providerName}|${log.query}`);
    return {
      ...log,
      totalSaved: stats?.saved || 0,
      totalSkipped: stats?.skipped || 0
    };
  });
}

function logRunToConsole(log: DailyRunLog): void {
  for (const providerLog of log.providerLogs) {
    console.log(
      JSON.stringify({
        providerName: providerLog.providerName,
        query: providerLog.query,
        status: providerLog.status,
        errorMessage: providerLog.errorMessage || "",
        totalFetched: providerLog.totalFetched,
        totalSaved: providerLog.totalSaved,
        totalSkipped: providerLog.totalSkipped
      })
    );
  }
}

export async function runDailyPipeline(now = new Date()): Promise<PipelineResult> {
  const runDate = toDateKey(now);
  const startedAt = new Date();
  const existingArticles = await readArticlesForDate(runDate);
  const existingUrls = new Set(existingArticles.map((article) => normalizeUrl(article.originalUrl)));
  const existingFingerprints = new Set(
    existingArticles.map((article) =>
      buildTitleFingerprint(article.originalTitle, article.sourceName, toDateKey(new Date(article.publishedAt)))
    )
  );
  const newArticles: StoredArticle[] = [];
  const providerLogs: ProviderLog[] = [];
  const statsByQuery = new Map<string, { saved: number; skipped: number }>();
  const providers = getNewsProviders();

  let totalFetched = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  for (const provider of providers) {
    try {
      const result = await provider.fetch();
      providerLogs.push(...result.logs);
      totalFetched += result.candidates.length;

      for (const candidate of result.candidates) {
        const statsKey = `${candidate.providerName}|${candidate.providerQuery || candidate.providerName}`;
        const stats = statsByQuery.get(statsKey) || { saved: 0, skipped: 0 };
        const normalizedUrl = normalizeUrl(candidate.originalUrl);
        const fingerprint = dedupeKey({ ...candidate, originalUrl: normalizedUrl });
        const processed = await processCandidate({ ...candidate, originalUrl: normalizedUrl });

        if (!processed || existingUrls.has(normalizedUrl) || existingFingerprints.has(fingerprint)) {
          totalSkipped += 1;
          stats.skipped += 1;
          statsByQuery.set(statsKey, stats);
          continue;
        }

        const stored = toStoredArticle(processed);
        existingUrls.add(normalizedUrl);
        existingFingerprints.add(fingerprint);
        newArticles.push(stored);
        totalSaved += 1;
        stats.saved += 1;
        statsByQuery.set(statsKey, stats);
      }
    } catch (error) {
      providerLogs.push({
        providerName: provider.name,
        query: provider.name,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Provider failed",
        totalFetched: 0,
        totalSaved: 0,
        totalSkipped: 0
      });
    }
  }

  const mergedProviderLogs = mergeProviderLogs(providerLogs, statsByQuery);
  const mergedArticles = [...existingArticles, ...newArticles];
  await writeArticlesForDate(runDate, mergedArticles);

  const failures = mergedProviderLogs
    .filter((log) => log.status === "failed")
    .map((log) => ({
      providerName: log.providerName,
      query: log.query,
      message: log.errorMessage || "Unknown error"
    }));
  const status: PipelineResult["status"] =
    failures.length === mergedProviderLogs.length ? "failed" : failures.length > 0 ? "partial" : "success";
  const runLog: DailyRunLog = {
    runDate,
    startedAt: startedAt.toISOString(),
    endedAt: new Date().toISOString(),
    status,
    totalFetched,
    totalSaved,
    totalSkipped,
    providerLogs: mergedProviderLogs
  };

  await writeRunLog(runDate, runLog);
  logRunToConsole(runLog);

  return {
    runDate,
    status,
    totalFetched,
    totalSaved,
    totalSkipped,
    failures,
    articlesPath: getArticlesFilePath(runDate),
    runLogPath: getRunLogFilePath(runDate)
  };
}
