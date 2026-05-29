import { TRACKED_PEOPLE, type TrackedPerson } from "@/config/people";
import { extractContext, normalizeQuotes } from "@/lib/news/text";
import type { MatchConfidence, PersonMatchCandidate } from "@/lib/news/types";

const CONTEXT_TERMS = [
  "administration",
  "advisor",
  "aide",
  "campaign",
  "congress",
  "democrat",
  "governor",
  "house",
  "immigration",
  "official",
  "president",
  "republican",
  "secretary",
  "senate",
  "senator",
  "speaker",
  "staff",
  "trump",
  "white house"
];

const SURNAME_RULES: Record<string, { personId: string; surname: string; context: string[] }> = {
  "stephen-miller": {
    personId: "stephen-miller",
    surname: "Miller",
    context: ["trump", "white house", "immigration", "advisor", "aide", "staff", "administration"]
  },
  "michael-needham": {
    personId: "michael-needham",
    surname: "Needham",
    context: ["america first", "policy", "afpi", "trump", "senate", "rubio", "advisor"]
  }
};

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasContext(text: string, contextTerms = CONTEXT_TERMS): boolean {
  const normalized = text.toLowerCase();
  return contextTerms.some((term) => normalized.includes(term));
}

function findAlias(text: string, alias: string): { index: number; value: string } | null {
  const normalizedText = normalizeQuotes(text);
  const normalizedAlias = normalizeQuotes(alias);
  const pattern = new RegExp(`\\b${escapeRegExp(normalizedAlias)}\\b`, "i");
  const match = normalizedText.match(pattern);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    index: match.index,
    value: match[0]
  };
}

function confidenceForAlias(alias: string, contextSnippet: string): MatchConfidence | null {
  const tokenCount = normalizeQuotes(alias).split(/\s+/).filter(Boolean).length;

  if (tokenCount >= 2) {
    return "high";
  }

  if (hasContext(contextSnippet)) {
    return "low";
  }

  return null;
}

function buildMatch(person: TrackedPerson, alias: string, text: string, index: number): PersonMatchCandidate {
  const contextSnippet = extractContext(text, index, alias.length);
  const confidence = confidenceForAlias(alias, contextSnippet) || "low";

  return {
    personId: person.id,
    nameEn: person.nameEn,
    nameZh: person.nameZh,
    team: person.team,
    matchedAlias: alias,
    confidence,
    contextSnippet
  };
}

function findSurnameOnlyMatches(text: string, existingKeys: Set<string>): PersonMatchCandidate[] {
  const matches: PersonMatchCandidate[] = [];

  for (const rule of Object.values(SURNAME_RULES)) {
    const person = TRACKED_PEOPLE.find((item) => item.id === rule.personId);
    if (!person) {
      continue;
    }

    const pattern = new RegExp(`\\b${escapeRegExp(rule.surname)}\\b`, "i");
    const match = normalizeQuotes(text).match(pattern);

    if (!match || match.index === undefined) {
      continue;
    }

    const contextSnippet = extractContext(text, match.index, rule.surname.length);
    const key = `${person.id}:${rule.surname}`;

    if (existingKeys.has(key) || !hasContext(contextSnippet, rule.context)) {
      continue;
    }

    existingKeys.add(key);
    matches.push({
      personId: person.id,
      nameEn: person.nameEn,
      nameZh: person.nameZh,
      team: person.team,
      matchedAlias: rule.surname,
      confidence: "low",
      contextSnippet
    });
  }

  return matches;
}

export function matchPeople(text: string): PersonMatchCandidate[] {
  const matches: PersonMatchCandidate[] = [];
  const existingKeys = new Set<string>();

  for (const person of TRACKED_PEOPLE.filter((item) => item.enabled !== false)) {
    for (const alias of person.aliases) {
      const found = findAlias(text, alias);

      if (!found) {
        continue;
      }

      const match = buildMatch(person, alias, text, found.index);
      const key = `${person.id}:${match.matchedAlias}`;

      if (existingKeys.has(key) || !match.confidence) {
        continue;
      }

      existingKeys.add(key);
      matches.push(match);
    }
  }

  matches.push(...findSurnameOnlyMatches(text, existingKeys));

  return matches;
}
