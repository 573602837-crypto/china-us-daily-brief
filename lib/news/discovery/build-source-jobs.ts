import { CONTENT_SOURCES } from "@/config/content-sources";
import { PRIORITY_SOURCE_QUERIES, SOURCE_TOPIC_TERMS } from "@/config/query-matrix";
import { TRACKED_ENTITIES } from "@/config/tracked-entities";
import type { DiscoveryJob } from "@/lib/news/discovery/types";
import { buildStableHash } from "@/lib/news/text";

function jobId(parts: string[]): string {
  return `job_${buildStableHash(parts.join("|"))}`;
}

function sourceTargetNames(sourceName: string): string[] {
  return [sourceName];
}

function sourceTargetIds(sourceId: string, sourceName: string): string[] {
  return TRACKED_ENTITIES.filter(
    (entity) => entity.id === sourceId || entity.name === sourceName || entity.aliases.includes(sourceName)
  ).map((entity) => entity.id);
}

export function buildSourceDiscoveryJobs(): DiscoveryJob[] {
  const jobs: DiscoveryJob[] = [];

  for (const source of CONTENT_SOURCES.filter((item) => item.enabled)) {
    const targetEntityNames = sourceTargetNames(source.name);
    const targetEntityIds = sourceTargetIds(source.id, source.name);

    for (const url of source.rssUrls) {
      jobs.push({
        id: jobId(["rss", source.id, url]),
        layer: "source",
        method: "rss",
        query: `${source.id} ${url}`,
        url,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }

    for (const url of source.sitemapUrls) {
      jobs.push({
        id: jobId(["sitemap", source.id, url]),
        layer: "source",
        method: "sitemap",
        query: `${source.id} ${url}`,
        url,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }

    if (source.robotsUrl) {
      jobs.push({
        id: jobId(["robots-sitemap", source.id, source.robotsUrl]),
        layer: "source",
        method: "robots-sitemap",
        query: `${source.id} ${source.robotsUrl}`,
        url: source.robotsUrl,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }

    for (const url of source.indexPageUrls) {
      jobs.push({
        id: jobId(["public-page", source.id, url]),
        layer: "source",
        method: "public-page",
        query: `${source.id} ${url}`,
        url,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }

    const sourceQueries = new Set([
      ...source.googleNewsQueries,
      ...SOURCE_TOPIC_TERMS.map((term) => `site:${source.domain} ${term}`),
      ...(PRIORITY_SOURCE_QUERIES[source.id] || [])
    ]);

    for (const query of sourceQueries) {
      jobs.push({
        id: jobId(["google-news", source.id, query]),
        layer: "source",
        method: "google-news",
        query,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }

    for (const query of source.gdeltQueries) {
      jobs.push({
        id: jobId(["gdelt", source.id, query]),
        layer: "source",
        method: "gdelt",
        query,
        source,
        sourceName: source.name,
        sourceDomain: source.domain,
        targetEntityIds,
        targetEntityNames
      });
    }
  }

  return jobs;
}
