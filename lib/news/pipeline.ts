import { readArticlesForDate, writeArticlesForDate, getArticlesFilePath } from "@/lib/data/articleStore";
import { writeRunLog, getRunLogFilePath } from "@/lib/data/runStore";
import { writeSourceHealthLog, getSourceHealthFilePath } from "@/lib/data/sourceHealthStore";
import { TRACKED_ENTITIES, type TrackedEntity } from "@/config/tracked-entities";
import { classifyTopics, getCandidateText, isChinaRelated, isRelevantCandidate } from "@/lib/news/classify";
import { buildDiscoveryJobs } from "@/lib/news/discovery/build-discovery-jobs";
import { matchEntities } from "@/lib/news/entityMatcher";
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

function getMaxArticlesPerSource(): number {
  const value = Number(process.env.MAX_ARTICLES_PER_SOURCE || "2");
  return Number.isFinite(value) && value > 0 ? value : 2;
}

function getMaxArticlesPerQuery(): number {
  const value = Number(process.env.MAX_ARTICLES_PER_QUERY || "2");
  return Number.isFinite(value) && value > 0 ? value : 2;
}

function shouldResetDailyArticles(): boolean {
  return ["1", "true", "yes"].includes((process.env.RESET_DAILY_ARTICLES || "").toLowerCase());
}

function sourceLimitKey(article: Pick<StoredArticle, "sourceName" | "sourceDomain">): string {
  return (article.sourceDomain || article.sourceName).toLowerCase();
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
    entityMatches: article.entityMatches,
    relatedOrganizationTags: article.relatedOrganizationTags,
    relatedEntityTags: article.relatedEntityTags,
    providersSeen: article.providersSeen,
    discoveryLayers: article.discoveryLayers,
    matchedQueries: article.matchedQueries,
    importanceLevel: article.importanceLevel,
    chinaRelated: article.chinaRelated
  };
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function mergeStringArrays(existing: string[] | undefined, incoming: string[] | undefined): string[] {
  return uniqueStrings([...(existing || []), ...(incoming || [])]);
}

function mergeStoredArticle(existing: StoredArticle, incoming: StoredArticle): void {
  existing.peopleTags = mergeStringArrays(existing.peopleTags, incoming.peopleTags);
  existing.relatedOrganizationTags = mergeStringArrays(existing.relatedOrganizationTags, incoming.relatedOrganizationTags);
  existing.relatedEntityTags = mergeStringArrays(existing.relatedEntityTags, incoming.relatedEntityTags);
  existing.providersSeen = mergeStringArrays(existing.providersSeen || [existing.providerName], incoming.providersSeen);
  existing.discoveryLayers = mergeStringArrays(existing.discoveryLayers, incoming.discoveryLayers) as StoredArticle["discoveryLayers"];
  existing.matchedQueries = mergeStringArrays(existing.matchedQueries, incoming.matchedQueries);

  const peopleMatchKeys = new Set(
    existing.peopleMatches.map((match) => `${match.personId}|${match.matchedAlias}|${match.confidence}`)
  );
  for (const match of incoming.peopleMatches) {
    const key = `${match.personId}|${match.matchedAlias}|${match.confidence}`;
    if (!peopleMatchKeys.has(key)) {
      existing.peopleMatches.push(match);
      peopleMatchKeys.add(key);
    }
  }

  const entityMatches = existing.entityMatches || [];
  const entityMatchKeys = new Set(
    entityMatches.map((match) => `${match.entityId}|${match.matchedAlias}|${match.confidence}`)
  );
  for (const match of incoming.entityMatches || []) {
    const key = `${match.entityId}|${match.matchedAlias}|${match.confidence}`;
    if (!entityMatchKeys.has(key)) {
      entityMatches.push(match);
      entityMatchKeys.add(key);
    }
  }
  existing.entityMatches = entityMatches;
}

async function processCandidate(candidate: RawArticleCandidate): Promise<ProcessedArticle | null> {
  const normalizedCandidate = {
    ...candidate,
    originalUrl: normalizeUrl(candidate.originalUrl)
  };
  const text = getCandidateText(normalizedCandidate);
  const personMatches = matchPeople(text);
  const entityMatches = matchEntities(text);
  const targetEntityIds = normalizedCandidate.targetEntityIds || [];
  const targetEntityNames = normalizedCandidate.targetEntityNames || [];
  const targetEntities = targetEntityIds
    .map((id) => TRACKED_ENTITIES.find((entity) => entity.id === id))
    .filter((entity): entity is TrackedEntity => Boolean(entity));
  const targetEntitiesByName = targetEntityNames
    .map((name) => TRACKED_ENTITIES.find((entity) => entity.name === name || entity.aliases.includes(name)))
    .filter((entity): entity is TrackedEntity => Boolean(entity));

  if (
    !isRelevantCandidate(normalizedCandidate) &&
    personMatches.length === 0 &&
    entityMatches.length === 0
  ) {
    return null;
  }

  const topicTags = classifyTopics(normalizedCandidate, personMatches.length > 0);
  const chinaRelated = isChinaRelated(normalizedCandidate);
  const summary = await buildChineseSummary(normalizedCandidate);
  const peopleTags = Array.from(new Set(personMatches.map((match) => match.nameZh || match.nameEn)));
  const relatedEntityTags = uniqueStrings([
    ...entityMatches.map((match) => match.name),
    ...targetEntityNames
  ]);
  const relatedOrganizationTags = uniqueStrings([
    ...entityMatches
      .filter((match) => match.type === "organization" || match.type === "team")
      .map((match) => match.name),
    ...targetEntities
      .filter((entity) => entity.type === "organization" || entity.type === "team")
      .map((entity) => entity.name),
    ...targetEntitiesByName
      .filter((entity) => entity.type === "organization" || entity.type === "team")
      .map((entity) => entity.name)
  ]);
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
    entityMatches,
    relatedOrganizationTags,
    relatedEntityTags,
    providersSeen: [normalizedCandidate.providerName].filter(Boolean),
    discoveryLayers: normalizedCandidate.discoveryLayer ? [normalizedCandidate.discoveryLayer] : [],
    matchedQueries: [normalizedCandidate.matchedQuery || normalizedCandidate.providerQuery].filter(
      (query): query is string => Boolean(query)
    ),
    importanceLevel,
    chinaRelated,
    titleFingerprint: buildTitleFingerprint(
      normalizedCandidate.originalTitle,
      normalizedCandidate.sourceName,
      toDateKey(normalizedCandidate.publishedAt)
    ),
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
  process.stderr.write(`\n🚀 Starting daily pipeline for ${runDate}\n`);
  const existingArticles = shouldResetDailyArticles() ? [] : await readArticlesForDate(runDate);
  const existingByUrl = new Map(existingArticles.map((article) => [normalizeUrl(article.originalUrl), article]));
  const existingByFingerprint = new Map(
    existingArticles.map((article) => [
      buildTitleFingerprint(article.originalTitle, article.sourceName, toDateKey(new Date(article.publishedAt))),
      article
    ])
  );
  const maxArticlesPerSource = getMaxArticlesPerSource();
  const maxArticlesPerQuery = getMaxArticlesPerQuery();
  const sourceCounts = new Map<string, number>();
  const queryCounts = new Map<string, number>();
  for (const article of existingArticles) {
    const key = sourceLimitKey(article);
    sourceCounts.set(key, (sourceCounts.get(key) || 0) + 1);
    for (const query of article.matchedQueries || []) {
      queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
    }
  }
  const newArticles: StoredArticle[] = [];
  const providerLogs: ProviderLog[] = [];
  const statsByQuery = new Map<string, { saved: number; skipped: number }>();
  const providers = getNewsProviders();
  const discoveryJobs = buildDiscoveryJobs();

  let totalFetched = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  const totalProviders = providers.length;
  let providerIdx = 0;
  for (const provider of providers) {
    providerIdx++;
    process.stderr.write(`[${providerIdx}/${totalProviders}] Fetching: ${provider.name} ...\n`);
    try {
      const result = await provider.fetch(discoveryJobs);
      process.stderr.write(`  ✓ ${provider.name}: ${result.candidates.length} candidates\n`);
      providerLogs.push(...result.logs);
      totalFetched += result.candidates.length;

      for (const candidate of result.candidates) {
        const statsKey = `${candidate.providerName}|${candidate.providerQuery || candidate.providerName}`;
        const stats = statsByQuery.get(statsKey) || { saved: 0, skipped: 0 };
        const normalizedUrl = normalizeUrl(candidate.originalUrl);
        const fingerprint = dedupeKey({ ...candidate, originalUrl: normalizedUrl });
        const processed = await processCandidate({ ...candidate, originalUrl: normalizedUrl });

        if (!processed) {
          totalSkipped += 1;
          stats.skipped += 1;
          statsByQuery.set(statsKey, stats);
          continue;
        }

        const duplicate = existingByUrl.get(normalizedUrl) || existingByFingerprint.get(fingerprint);
        if (duplicate) {
          mergeStoredArticle(duplicate, toStoredArticle(processed));
          totalSkipped += 1;
          stats.skipped += 1;
          statsByQuery.set(statsKey, stats);
          continue;
        }

        const stored = toStoredArticle(processed);
        const queryKey = (stored.matchedQueries ?? [])[0] || candidate.providerQuery || candidate.providerName;
        const sourceKey = sourceLimitKey(stored);
        const sourceCount = sourceCounts.get(sourceKey) || 0;
        if (sourceCount >= maxArticlesPerSource) {
          totalSkipped += 1;
          stats.skipped += 1;
          statsByQuery.set(statsKey, stats);
          continue;
        }
        const queryCount = queryCounts.get(queryKey) || 0;
        if (queryCount >= maxArticlesPerQuery) {
          totalSkipped += 1;
          stats.skipped += 1;
          statsByQuery.set(statsKey, stats);
          continue;
        }

        existingByUrl.set(normalizedUrl, stored);
        existingByFingerprint.set(fingerprint, stored);
        sourceCounts.set(sourceKey, sourceCount + 1);
        queryCounts.set(queryKey, queryCount + 1);
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
  process.stderr.write(`\n✅ Done! ${totalSaved} saved, ${totalSkipped} skipped, total ${mergedArticles.length} articles for ${runDate}\n`);

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
  await writeSourceHealthLog(runDate, mergedArticles, runLog);
  logRunToConsole(runLog);

  return {
    runDate,
    status,
    totalFetched,
    totalSaved,
    totalSkipped,
    failures,
    articlesPath: getArticlesFilePath(runDate),
    runLogPath: getRunLogFilePath(runDate),
    sourceHealthPath: getSourceHealthFilePath(runDate)
  };
}
