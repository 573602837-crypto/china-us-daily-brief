import type { ContentSource } from "@/config/content-sources";
import type { TrackedEntity } from "@/config/tracked-entities";

export type DiscoveryLayer = "source" | "entity" | "issue";

export type DiscoveryMethod =
  | "rss"
  | "sitemap"
  | "robots-sitemap"
  | "public-page"
  | "google-news"
  | "gdelt";

export type DiscoveryJob = {
  id: string;
  layer: DiscoveryLayer;
  method: DiscoveryMethod;
  query: string;
  url?: string;
  source?: ContentSource;
  sourceName?: string;
  sourceDomain?: string;
  entity?: TrackedEntity;
  targetEntityIds: string[];
  targetEntityNames: string[];
};
