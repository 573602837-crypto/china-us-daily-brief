import type { ProviderLog, RawArticleCandidate } from "@/lib/news/types";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

export type ProviderFetchResult = {
  candidates: RawArticleCandidate[];
  logs: ProviderLog[];
};

export type NewsProvider = {
  name: string;
  fetch(jobs: DiscoveryJob[]): Promise<ProviderFetchResult>;
};

export type ProviderQueryResult = {
  query: string;
  candidates: RawArticleCandidate[];
};
