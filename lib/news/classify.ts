import { CHINA_RELATED_KEYWORDS, NEGATIVE_KEYWORDS, RELEVANCE_KEYWORDS } from "@/config/keywords";
import { TOPICS, type TopicId } from "@/config/topics";
import { countKeywordHits, includesKeyword } from "@/lib/news/text";
import type { RawArticleCandidate } from "@/lib/news/types";

export function getCandidateText(candidate: RawArticleCandidate): string {
  return [candidate.originalTitle, candidate.rawDescription || "", candidate.contentSnippet || ""].join(" ");
}

export function isRelevantCandidate(candidate: RawArticleCandidate): boolean {
  const text = getCandidateText(candidate);
  const positiveHits = countKeywordHits(text, RELEVANCE_KEYWORDS);
  const negativeHits = countKeywordHits(text, NEGATIVE_KEYWORDS);

  return positiveHits > 0 && negativeHits < 2;
}

export function isChinaRelated(candidate: RawArticleCandidate): boolean {
  return includesKeyword(getCandidateText(candidate), CHINA_RELATED_KEYWORDS);
}

export function classifyTopics(candidate: RawArticleCandidate, hasPeopleMatch: boolean): TopicId[] {
  const text = getCandidateText(candidate);
  const scored = TOPICS.map((topic) => ({
    id: topic.id,
    hits: countKeywordHits(text, [...topic.keywords])
  }))
    .filter((topic) => topic.hits > 0)
    .sort((left, right) => right.hits - left.hits);

  const topicIds = scored.map((topic) => topic.id);

  if (hasPeopleMatch && !topicIds.includes("key_figures")) {
    topicIds.push("key_figures");
  }

  if (topicIds.length === 0) {
    return ["other_related"];
  }

  return Array.from(new Set(topicIds)).slice(0, 4);
}
