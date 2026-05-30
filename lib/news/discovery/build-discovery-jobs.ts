import { buildEntityDiscoveryJobs } from "@/lib/news/discovery/build-entity-jobs";
import { buildIssueDiscoveryJobs } from "@/lib/news/discovery/build-issue-jobs";
import { buildSourceDiscoveryJobs } from "@/lib/news/discovery/build-source-jobs";
import type { DiscoveryJob } from "@/lib/news/discovery/types";

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

  const deduped = jobs.filter((job) => {
    if (allowedMethods.size > 0 && !allowedMethods.has(job.method)) {
      return false;
    }

    const key = `${job.method}|${job.query}|${job.url || ""}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return maxJobs > 0 ? deduped.slice(0, maxJobs) : deduped;
}
