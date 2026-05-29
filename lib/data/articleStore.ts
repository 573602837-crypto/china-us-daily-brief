import { TOPIC_LABELS, type TopicId } from "@/config/topics";
import { appConfig } from "@/lib/settings";
import { getDataPath, listJsonDates, readJsonFile, writeJsonFile } from "@/lib/data/jsonStore";
import { formatDateKey } from "@/lib/news/text";
import type { ArticleView, PersonMatchCandidate, StoredArticle } from "@/lib/news/types";

export type ArticleFilters = {
  date?: string;
  topic?: string;
  source?: string;
  person?: string;
  q?: string;
  limit?: number;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: appConfig.timezone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toArticleView(article: StoredArticle): ArticleView {
  return {
    id: article.id,
    sourceName: article.sourceName,
    sourceDomain: article.sourceDomain,
    providerName: article.providerName,
    originalTitle: article.originalTitle,
    chineseTitle: article.chineseTitle,
    originalUrl: article.originalUrl,
    publishedAt: formatDateTime(article.publishedAt),
    publishedDate: formatDateKey(new Date(article.publishedAt), appConfig.timezone),
    fetchedAt: formatDateTime(article.fetchedAt),
    summaryZh: article.summaryZh,
    summaryBasis: article.summaryBasis,
    contentSnippet: article.contentSnippet || null,
    topicTags: article.topicTags,
    topicLabels: article.topicTags.map((topic) => TOPIC_LABELS[topic]).filter(Boolean),
    peopleTags: article.peopleTags,
    peopleMatches: article.peopleMatches,
    importanceLevel: article.importanceLevel,
    chinaRelated: article.chinaRelated,
    sourceReliability: 3,
    relatedOrganizationTags: article.relatedOrganizationTags ?? [],
    relatedEntityTags: article.relatedEntityTags ?? [],
    providersSeen: article.providersSeen ?? [article.providerName].filter(Boolean),
    discoveryLayers: article.discoveryLayers ?? [],
    matchedQueries: article.matchedQueries ?? [],
  };
}

export function getArticlesFilePath(dateKey: string): string {
  return getDataPath("articles", `${dateKey}.json`);
}

export async function readArticlesForDate(dateKey: string): Promise<StoredArticle[]> {
  return readJsonFile<StoredArticle[]>(getArticlesFilePath(dateKey), []);
}

export async function writeArticlesForDate(dateKey: string, articles: StoredArticle[]): Promise<void> {
  const sorted = [...articles].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );
  await writeJsonFile(getArticlesFilePath(dateKey), sorted);
}

export async function getAvailableDates(): Promise<string[]> {
  return listJsonDates("articles");
}

export async function getAllStoredArticles(limitPerFile = 500): Promise<StoredArticle[]> {
  const dates = await getAvailableDates();
  const nested = await Promise.all(dates.map((date) => readArticlesForDate(date)));
  return nested
    .flatMap((articles) => articles.slice(0, limitPerFile))
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
}

function matchesSearch(article: StoredArticle, query: string): boolean {
  const q = query.toLowerCase();
  return [
    article.originalTitle,
    article.chineseTitle,
    article.summaryZh,
    article.sourceName,
    article.sourceDomain,
    article.rawDescription || "",
    article.contentSnippet || ""
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesPerson(article: StoredArticle, personId: string): boolean {
  return article.peopleMatches.some((match: PersonMatchCandidate) => match.personId === personId);
}

export async function getArticles(filters: ArticleFilters = {}): Promise<ArticleView[]> {
  const rows = filters.date ? await readArticlesForDate(filters.date) : await getAllStoredArticles();
  const filtered = rows.filter((article) => {
    if (filters.topic && !article.topicTags.includes(filters.topic as TopicId)) {
      return false;
    }

    if (filters.source && article.sourceName !== filters.source && article.sourceDomain !== filters.source) {
      return false;
    }

    if (filters.person && !matchesPerson(article, filters.person)) {
      return false;
    }

    if (filters.q && !matchesSearch(article, filters.q)) {
      return false;
    }

    return true;
  });

  return filtered.slice(0, filters.limit || 100).map(toArticleView);
}

export async function getTodayArticles(): Promise<ArticleView[]> {
  const dateKey = formatDateKey(new Date(), appConfig.timezone);
  const articles = await getArticles({ date: dateKey, limit: 500 });
  const sourceCounts = new Map<string, number>();

  return articles.filter((article) => {
    const key = article.sourceName;
    const count = sourceCounts.get(key) || 0;
    if (count >= 16) {
      return false;
    }

    sourceCounts.set(key, count + 1);
    return true;
  });
}

export async function getDashboardStats(date?: string) {
  const dateKey = date || formatDateKey(new Date(), appConfig.timezone);
  const articles = await getArticles({ date: dateKey, limit: 500 });
  const topicCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();

  for (const article of articles) {
    for (const label of article.topicLabels) {
      topicCounts.set(label, (topicCounts.get(label) || 0) + 1);
    }

    for (const person of article.peopleTags) {
      peopleCounts.set(person, (peopleCounts.get(person) || 0) + 1);
    }
  }

  return {
    dateKey,
    total: articles.length,
    topicCounts: Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]),
    peopleCounts: Array.from(peopleCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12)
  };
}
