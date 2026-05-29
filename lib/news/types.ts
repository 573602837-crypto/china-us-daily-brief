import type { ContentSource } from "@/config/content-sources";
import type { TopicId } from "@/config/topics";
import type { DiscoveryLayer } from "@/lib/news/discovery/types";

export type SummaryBasis = "基于标题/摘要生成";

export type MatchConfidence = "high" | "medium" | "low";

export type RawArticleCandidate = {
  source?: ContentSource;
  sourceName: string;
  sourceDomain: string;
  providerName: string;
  providerQuery?: string;
  discoveryLayer?: DiscoveryLayer;
  matchedQuery?: string;
  targetEntityIds?: string[];
  targetEntityNames?: string[];
  originalTitle: string;
  originalUrl: string;
  publishedAt: Date;
  author?: string;
  rawDescription?: string;
  contentSnippet?: string;
};

export type EntityMatchCandidate = {
  entityId: string;
  name: string;
  type: "person" | "organization" | "team" | "issue";
  matchedAlias: string;
  confidence: MatchConfidence;
  contextSnippet?: string;
};

export type PersonMatchCandidate = {
  personId: string;
  nameEn: string;
  nameZh: string;
  team: string;
  matchedAlias: string;
  confidence: MatchConfidence;
  contextSnippet?: string;
};

export type SummaryResult = {
  chineseTitle: string;
  summaryZh: string;
  summaryBasis: SummaryBasis;
};

export type ProcessedArticle = RawArticleCandidate &
  SummaryResult & {
    id: string;
    topicTags: TopicId[];
    peopleMatches: PersonMatchCandidate[];
    peopleTags: string[];
    entityMatches: EntityMatchCandidate[];
    relatedOrganizationTags: string[];
    relatedEntityTags: string[];
    providersSeen: string[];
    discoveryLayers: DiscoveryLayer[];
    matchedQueries: string[];
    importanceLevel: number;
    chinaRelated: boolean;
    titleFingerprint: string;
  };

export type ArticleView = {
  id: string;
  sourceName: string;
  sourceDomain: string;
  providerName: string;
  sourceType?: string;
  originalTitle: string;
  chineseTitle: string;
  originalUrl: string;
  publishedAt: string;
  publishedDate: string;
  fetchedAt: string;
  author?: string | null;
  summaryZh: string;
  summaryBasis: SummaryBasis | string;
  contentSnippet?: string | null;
  topicTags: TopicId[];
  topicLabels: string[];
  peopleTags: string[];
  peopleMatches: PersonMatchCandidate[];
  relatedOrganizationTags: string[];
  relatedEntityTags: string[];
  providersSeen: string[];
  discoveryLayers: DiscoveryLayer[];
  matchedQueries: string[];
  importanceLevel: number;
  chinaRelated: boolean;
  sourceReliability: number;
};

export type StoredArticle = {
  id: string;
  sourceName: string;
  sourceDomain: string;
  providerName: string;
  originalTitle: string;
  chineseTitle: string;
  originalUrl: string;
  publishedAt: string;
  fetchedAt: string;
  rawDescription?: string;
  contentSnippet?: string;
  summaryZh: string;
  summaryBasis: SummaryBasis;
  topicTags: TopicId[];
  peopleTags: string[];
  peopleMatches: PersonMatchCandidate[];
  relatedOrganizationTags?: string[];
  relatedEntityTags?: string[];
  entityMatches?: EntityMatchCandidate[];
  providersSeen?: string[];
  discoveryLayers?: DiscoveryLayer[];
  matchedQueries?: string[];
  importanceLevel: number;
  chinaRelated: boolean;
};

export type ProviderLog = {
  providerName: string;
  query: string;
  status: "success" | "failed";
  errorMessage?: string;
  totalFetched: number;
  totalSaved: number;
  totalSkipped: number;
};

export type DailyRunLog = {
  runDate: string;
  startedAt: string;
  endedAt: string;
  status: "success" | "partial" | "failed";
  totalFetched: number;
  totalSaved: number;
  totalSkipped: number;
  providerLogs: ProviderLog[];
};

export type PipelineResult = {
  runDate: string;
  status: "success" | "partial" | "failed";
  totalFetched: number;
  totalSaved: number;
  totalSkipped: number;
  failures: Array<{ providerName: string; query: string; message: string }>;
  articlesPath?: string;
  runLogPath?: string;
};
