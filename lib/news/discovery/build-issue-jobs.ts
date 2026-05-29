import { ISSUE_QUERIES } from "@/config/query-matrix";
import type { DiscoveryJob } from "@/lib/news/discovery/types";
import { buildStableHash } from "@/lib/news/text";

function jobId(parts: string[]): string {
  return `job_${buildStableHash(parts.join("|"))}`;
}

export function buildIssueDiscoveryJobs(): DiscoveryJob[] {
  return ISSUE_QUERIES.flatMap((query) => [
    {
      id: jobId(["issue-google", query]),
      layer: "issue" as const,
      method: "google-news" as const,
      query,
      targetEntityIds: [],
      targetEntityNames: []
    },
    {
      id: jobId(["issue-gdelt", query]),
      layer: "issue" as const,
      method: "gdelt" as const,
      query,
      targetEntityIds: [],
      targetEntityNames: []
    }
  ]);
}
