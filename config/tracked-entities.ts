import { TRACKED_PEOPLE } from "@/config/people";
import type { TopicId } from "@/config/topics";

export type TrackedEntityType = "person" | "organization" | "team" | "issue";

export type TrackedEntity = {
  id: string;
  name: string;
  type: TrackedEntityType;
  aliases: string[];
  queryTemplates?: string[];
  relatedTopics: TopicId[];
  enabled: boolean;
  priority?: boolean;
};

const PERSON_ENTITIES: TrackedEntity[] = TRACKED_PEOPLE.map((person) => ({
  id: person.id,
  name: person.nameEn,
  type: "person",
  aliases: person.aliases,
  relatedTopics: ["key_figures"],
  enabled: person.enabled !== false,
  priority: person.priority
}));

export const TRACKED_ENTITIES: TrackedEntity[] = [
  ...PERSON_ENTITIES,
  {
    id: "america-first-policy-institute",
    name: "America First Policy Institute",
    type: "organization",
    aliases: ["America First Policy Institute", "AFPI", "America First Policy"],
    relatedTopics: ["us_domestic", "other_related"],
    enabled: true,
    priority: true
  },
  {
    id: "national-security-action",
    name: "National Security Action",
    type: "organization",
    aliases: ["National Security Action", "NSA Action"],
    relatedTopics: ["other_related", "us_china_relations"],
    enabled: true,
    priority: true
  },
  {
    id: "trump-team",
    name: "Trump team",
    type: "team",
    aliases: ["Trump team", "Trump administration", "Trump transition", "Trump allies"],
    relatedTopics: ["us_domestic", "key_figures"],
    enabled: true,
    priority: true
  },
  {
    id: "democratic-party",
    name: "Democratic Party",
    type: "team",
    aliases: ["Democratic Party", "Democrats", "House Democrats", "Senate Democrats"],
    relatedTopics: ["us_domestic"],
    enabled: true
  },
  {
    id: "republican-party",
    name: "Republican Party",
    type: "team",
    aliases: ["Republican Party", "Republicans", "House Republicans", "Senate Republicans", "GOP"],
    relatedTopics: ["us_domestic"],
    enabled: true
  },
  {
    id: "white-house",
    name: "White House",
    type: "organization",
    aliases: ["White House"],
    relatedTopics: ["us_domestic", "other_related"],
    enabled: true
  },
  {
    id: "state-department",
    name: "State Department",
    type: "organization",
    aliases: ["State Department", "Department of State"],
    relatedTopics: ["us_china_relations", "other_related"],
    enabled: true
  },
  {
    id: "commerce-department",
    name: "Commerce Department",
    type: "organization",
    aliases: ["Commerce Department", "Department of Commerce"],
    relatedTopics: ["china_tech_policy", "trade_tariffs"],
    enabled: true
  },
  {
    id: "ustr",
    name: "USTR",
    type: "organization",
    aliases: ["USTR", "United States Trade Representative"],
    relatedTopics: ["trade_tariffs"],
    enabled: true
  },
  {
    id: "congress",
    name: "Congress",
    type: "organization",
    aliases: ["Congress", "House of Representatives", "Senate"],
    relatedTopics: ["congress_china", "us_domestic"],
    enabled: true
  },
  {
    id: "china-policy",
    name: "China policy",
    type: "issue",
    aliases: ["China policy", "U.S.-China", "US-China", "China strategy"],
    relatedTopics: ["us_china_relations"],
    enabled: true
  },
  {
    id: "export-controls",
    name: "Export controls",
    type: "issue",
    aliases: ["export controls", "chip controls", "semiconductor controls"],
    relatedTopics: ["china_tech_policy"],
    enabled: true
  }
];
