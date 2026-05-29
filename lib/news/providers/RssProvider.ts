import type { NewsProvider, ProviderFetchResult } from "@/lib/news/providers/types";
import {
  buildProviderLog,
  fetchText,
  getSourceDomain,
  parseRssOrAtom,
  runWithConcurrency
} from "@/lib/news/providers/providerUtils";

export class RssProvider implements NewsProvider {
  name = "RssProvider";

  async fetch(discoveryJobs: Parameters<NewsProvider["fetch"]>[0]): Promise<ProviderFetchResult> {
    const jobs = discoveryJobs.filter((job) => job.method === "rss" && job.source && job.url);
    const results = await runWithConcurrency(jobs, 5, async (job) => {
        const source = job.source!;
        const rssUrl = job.url!;
        const query = job.query;

        try {
          const xml = await fetchText(rssUrl, 10000);
          const sourceDomain = getSourceDomain(source.homepageUrl);
          const parsed = parseRssOrAtom({
            xml,
              sourceName: source.name,
              sourceDomain: job.sourceDomain || sourceDomain,
              providerName: this.name,
              providerQuery: query,
            fallbackUrl: source.homepageUrl
          })
            .slice(0, source.maxItemsPerRun || 24)
            .map((candidate) => ({
              ...candidate,
              discoveryLayer: job.layer,
              matchedQuery: job.query,
              targetEntityIds: job.targetEntityIds,
              targetEntityNames: job.targetEntityNames
            }));

          return {
            candidates: parsed,
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "success",
              totalFetched: parsed.length
            })
          };
        } catch (error) {
          return {
            candidates: [],
            log: buildProviderLog({
              providerName: this.name,
              query,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "RSS fetch failed"
            })
          };
        }
    });

    return {
      candidates: results.flatMap((result) => result.candidates),
      logs: results.map((result) => result.log)
    };
  }
}
