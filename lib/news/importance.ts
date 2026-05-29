import type { TopicId } from "@/config/topics";
import type { PersonMatchCandidate } from "@/lib/news/types";

const HIGH_SIGNAL_TOPICS: TopicId[] = [
  "us_china_relations",
  "china_tech_policy",
  "taiwan",
  "trade_tariffs",
  "congress_china"
];

export function scoreImportance(params: {
  sourceReliability: number;
  topicTags: TopicId[];
  peopleMatches: PersonMatchCandidate[];
  chinaRelated: boolean;
}): number {
  let score = params.sourceReliability;

  score += params.topicTags.filter((topic) => HIGH_SIGNAL_TOPICS.includes(topic)).length;
  score += params.peopleMatches.filter((match) => match.confidence === "high").length;

  if (params.chinaRelated) {
    score += 1;
  }

  if (params.peopleMatches.some((match) => match.personId === "stephen-miller" || match.personId === "michael-needham")) {
    score += 1;
  }

  if (score >= 8) {
    return 5;
  }

  if (score >= 6) {
    return 4;
  }

  if (score >= 4) {
    return 3;
  }

  if (score >= 2) {
    return 2;
  }

  return 1;
}
