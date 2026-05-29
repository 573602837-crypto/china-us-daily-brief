import { buildFallbackSummary } from "@/lib/news/summarizer/fallbackSummarizer";
import { buildOpenAISummary } from "@/lib/news/summarizer/openaiSummarizer";
import type { RawArticleCandidate, SummaryResult } from "@/lib/news/types";

export async function buildChineseSummary(candidate: RawArticleCandidate): Promise<SummaryResult> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const summary = await buildOpenAISummary(candidate);
      if (summary) {
        return summary;
      }
    } catch {
      return buildFallbackSummary(candidate);
    }
  }

  return buildFallbackSummary(candidate);
}
