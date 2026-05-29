import { buildEntityDiscoveryJobs } from "@/lib/news/discovery/build-entity-jobs";
import { buildIssueDiscoveryJobs } from "@/lib/news/discovery/build-issue-jobs";
import { buildSourceDiscoveryJobs } from "@/lib/news/discovery/build-source-jobs";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

export function buildDiscoveryJobs(): DiscoveryJob[] {
  const jobs = [...buildSourceDiscoveryJobs(), ...buildEntityDiscoveryJobs(), ...buildIssueDiscoveryJobs()];
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = `${job.method}|${job.query}|${job.url || ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
