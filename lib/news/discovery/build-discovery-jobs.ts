import { buildEntityDiscoveryJobs } from "@/lib/news/discovery/build-entity-jobs";
import { buildIssueDiscoveryJobs } from "@/lib/news/discovery/build-issue-jobs";
import { buildSourceDiscoveryJobs } from "@/lib/news/discovery/build-source-jobs";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

const PRIORITY_SCOPES = new Set([
  "truth-social",
  "axios",
  "washington-post-politics",
  "foreign-affairs",
  "america-first-policy-institute"
]);

function discoveryScope(job: DiscoveryJob): string {
  if (job.source?.id) {
    return `source:${job.source.id}`;
  }

  if (job.entity?.id) {
    return `entity:${job.entity.id}`;
  }

  return `layer:${job.layer}`;
}

function scopePriority(scope: string): number {
  const id = scope.split(":")[1] || scope;

  if (id === "truth-social") {
    return 0;
  }

  return PRIORITY_SCOPES.has(id) ? 1 : 2;
}

function takeFairJobs(jobs: DiscoveryJob[], maxJobs: number): DiscoveryJob[] {
  if (maxJobs <= 0 || jobs.length <= maxJobs) {
    return jobs;
  }

  const buckets = new Map<string, DiscoveryJob[]>();

  for (const job of jobs) {
    const scope = discoveryScope(job);
    const bucket = buckets.get(scope) || [];
    bucket.push(job);
    buckets.set(scope, bucket);
  }

  const orderedScopes = Array.from(buckets.keys()).sort((left, right) => {
    const priorityDiff = scopePriority(left) - scopePriority(right);
    return priorityDiff || 0;
  });
  const selected: DiscoveryJob[] = [];

  while (selected.length < maxJobs) {
    let added = false;

    for (const scope of orderedScopes) {
      const bucket = buckets.get(scope);
      const job = bucket?.shift();

      if (!job) {
        continue;
      }

      selected.push(job);
      added = true;

      if (selected.length >= maxJobs) {
        break;
      }
    }

    if (!added) {
      break;
    }
  }

  return selected;
}

function matchesQueryFilter(job: DiscoveryJob, filter: string): boolean {
  if (!filter) {
    return true;
  }

  return [
    job.query,
    job.source?.id,
    job.source?.name,
    job.source?.domain,
    job.entity?.id,
    job.entity?.name,
    ...job.targetEntityNames
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(filter);
}

export function buildDiscoveryJobs(): DiscoveryJob[] {
  const jobs = [...buildSourceDiscoveryJobs(), ...buildEntityDiscoveryJobs(), ...buildIssueDiscoveryJobs()];
  const seen = new Set<string>();
  const allowedMethods = new Set(
    (process.env.DISCOVERY_METHODS || "")
      .split(",")
      .map((method) => method.trim())
      .filter(Boolean)
  );
  const maxJobs = Number(process.env.DISCOVERY_JOB_LIMIT || "0");
  const queryFilter = (process.env.DISCOVERY_QUERY_FILTER || "").trim().toLowerCase();

  const deduped = jobs.filter((job) => {
    if (allowedMethods.size > 0 && !allowedMethods.has(job.method)) {
      return false;
    }

    if (!matchesQueryFilter(job, queryFilter)) {
      return false;
    }

    const key = `${job.method}|${job.query}|${job.url || ""}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return takeFairJobs(deduped, maxJobs);
}
