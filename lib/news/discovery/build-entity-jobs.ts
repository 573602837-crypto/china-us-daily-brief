import {
  ENTITY_TOPIC_MODIFIERS,
  PERSON_ORGANIZATION_QUERIES,
  PRIORITY_SOURCE_QUERIES
} from "@/config/query-matrix";
import { TRACKED_ENTITIES } from "@/config/tracked-entities";
import type { DiscoveryJob } from "@/lib/news/discovery/types";
import { buildStableHash } from "@/lib/news/text";

function quote(value: string): string {
  return /\s/.test(value) && !value.startsWith("\"") ? `"${value}"` : value;
}

function jobId(parts: string[]): string {
  return `job_${buildStableHash(parts.join("|"))}`;
}

export function buildEntityDiscoveryJobs(): DiscoveryJob[] {
  const jobs: DiscoveryJob[] = [];
  const entities = TRACKED_ENTITIES.filter((entity) => entity.enabled);

  for (const entity of entities) {
    const aliases = entity.aliases.slice(0, entity.priority ? 3 : 2);
    const modifiers = entity.priority ? ENTITY_TOPIC_MODIFIERS : ENTITY_TOPIC_MODIFIERS.slice(0, 5);
    const queries = new Set<string>();

    for (const alias of aliases) {
      queries.add(quote(alias));
      for (const modifier of modifiers) {
        queries.add(`${quote(alias)} ${modifier}`);
      }
    }

    if (entity.id === "america-first-policy-institute") {
      for (const query of PRIORITY_SOURCE_QUERIES["america-first-policy-institute"] || []) {
        queries.add(query);
      }
    }

    for (const query of queries) {
      jobs.push({
        id: jobId(["entity", entity.id, query]),
        layer: "entity",
        method: "google-news",
        query,
        entity,
        targetEntityIds: [entity.id],
        targetEntityNames: [entity.name]
      });

      if (entity.priority || entity.type !== "person") {
        jobs.push({
          id: jobId(["entity-gdelt", entity.id, query]),
          layer: "entity",
          method: "gdelt",
          query,
          entity,
          targetEntityIds: [entity.id],
          targetEntityNames: [entity.name]
        });
      }
    }
  }

  for (const [person, organization] of PERSON_ORGANIZATION_QUERIES) {
    const query = `"${person}" "${organization}"`;
    const matchedEntities = entities.filter(
      (entity) => entity.aliases.includes(person) || entity.aliases.includes(organization) || entity.name === organization
    );

    jobs.push({
      id: jobId(["person-org", query]),
      layer: "entity",
      method: "google-news",
      query,
      targetEntityIds: matchedEntities.map((entity) => entity.id),
      targetEntityNames: matchedEntities.map((entity) => entity.name)
    });
  }

  return jobs;
}
