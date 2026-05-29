import { TRACKED_ENTITIES } from "@/config/tracked-entities";
import { extractContext, normalizeQuotes } from "@/lib/news/text";
import type { EntityMatchCandidate } from "@/lib/news/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasRegex(alias: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(normalizeQuotes(alias))}\\b`, "i");
}

export function matchEntities(text: string): EntityMatchCandidate[] {
  const normalizedText = normalizeQuotes(text);
  const matches: EntityMatchCandidate[] = [];

  for (const entity of TRACKED_ENTITIES.filter((item) => item.enabled)) {
    for (const alias of entity.aliases) {
      if (alias.length < 3) {
        continue;
      }

      const regex = aliasRegex(alias);
      const match = regex.exec(normalizedText);

      if (!match) {
        continue;
      }

      matches.push({
        entityId: entity.id,
        name: entity.name,
        type: entity.type,
        matchedAlias: alias,
        confidence: alias.includes(" ") || alias.toUpperCase() === alias ? "high" : "medium",
        contextSnippet: extractContext(normalizedText, match.index, match[0].length)
      });
      break;
    }
  }

  return matches;
}
