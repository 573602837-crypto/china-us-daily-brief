import { TRACKED_PEOPLE } from "@/config/people";
import { PRIMARY_SOURCES } from "@/config/primary-sources";
import {
  getArticles,
  getAvailableDates,
  getDashboardStats,
  getTodayArticles,
  getAllStoredArticles,
  type ArticleFilters
} from "@/lib/data/articleStore";
import { getRecentRuns, getSourceStatus } from "@/lib/data/runStore";

export { getArticles, getAvailableDates, getDashboardStats, getTodayArticles, getRecentRuns, getSourceStatus };
export type { ArticleFilters };

export async function getPeople() {
  const articles = await getAllStoredArticles();

  return TRACKED_PEOPLE.map((person) => ({
    ...person,
    aliases: person.aliases,
    priority: Boolean(person.priority),
    matches: articles
      .flatMap((article) => article.peopleMatches)
      .filter((match) => match.personId === person.id)
      .map((match, index) => ({ id: `${person.id}-${index}`, ...match }))
  })).sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority ? -1 : 1;
    }

    return left.nameEn.localeCompare(right.nameEn);
  });
}

export async function getPerson(personId: string) {
  return TRACKED_PEOPLE.find((person) => person.id === personId) || null;
}

export async function getSourceNames() {
  return PRIMARY_SOURCES.map((source) => source.name).sort();
}

export async function getSourceOptions() {
  return PRIMARY_SOURCES.map((source) => ({
    label: source.name,
    value: source.domain
  }));
}
