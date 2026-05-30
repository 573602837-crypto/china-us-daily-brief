export const SOURCE_TOPIC_TERMS = [
  "China",
  "Taiwan",
  "\"U.S.-China\"",
  "Trump China",
  "Congress China",
  "export controls",
  "tariffs China",
  "semiconductor China"
];

export const ENTITY_TOPIC_MODIFIERS = [
  "China",
  "Taiwan",
  "Trump",
  "Congress",
  "\"national security\"",
  "\"foreign policy\"",
  "trade",
  "technology",
  "immigration"
];

export const PERSON_ORGANIZATION_QUERIES = [
  ["Stephen Miller", "America First Policy Institute"],
  ["Michael Needham", "America First Policy Institute"],
  ["Mike Needham", "America First Policy Institute"],
  ["Jake Sullivan", "National Security Action"],
  ["Gavin Newsom", "Trump"],
  ["JD Vance", "Michael Needham"],
  ["Donald Trump", "Truth Social"],
  ["Stephen Miller", "Truth Social"]
];

export const ISSUE_QUERIES = [
  "\"U.S.-China\"",
  "China Taiwan",
  "Trump China",
  "Congress China",
  "China tariffs",
  "China semiconductor",
  "export controls China",
  "Taiwan Strait",
  "\"U.S. technology policy\" China",
  "China national security",
  "China election interference",
  "\"China\" \"Trump administration\"",
  "\"Taiwan\" \"Congress\"",
  "\"semiconductor\" \"China\" \"Commerce Department\""
];

export const PRIORITY_SOURCE_QUERIES: Record<string, string[]> = {
  axios: [
    "site:axios.com China",
    "site:axios.com Trump China",
    "site:axios.com Taiwan",
    "site:axios.com Congress China",
    "site:axios.com export controls",
    "site:axios.com \"U.S.-China\""
  ],
  "washington-post-politics": [
    "site:washingtonpost.com China",
    "site:washingtonpost.com Taiwan",
    "site:washingtonpost.com Trump China",
    "site:washingtonpost.com Congress China",
    "site:washingtonpost.com tariffs China"
  ],
  "foreign-affairs": [
    "site:foreignaffairs.com China",
    "site:foreignaffairs.com Taiwan",
    "site:foreignaffairs.com \"U.S.-China\"",
    "site:foreignaffairs.com Trump",
    "site:foreignaffairs.com \"great power\"",
    "\"Foreign Affairs\" China",
    "\"Foreign Affairs\" Taiwan"
  ],
  "america-first-policy-institute": [
    "\"America First Policy Institute\"",
    "\"America First Policy Institute\" Trump",
    "\"America First Policy Institute\" China",
    "\"America First Policy Institute\" \"national security\"",
    "\"America First Policy Institute\" \"foreign policy\"",
    "\"America First Policy Institute\" immigration",
    "AFPI Trump",
    "AFPI China",
    "AFPI \"national security\"",
    "\"Stephen Miller\" \"America First Policy Institute\"",
    "\"Michael Needham\" \"America First Policy Institute\""
  ],
  "truth-social": [
    "site:truthsocial.com/@realDonaldTrump China",
    "site:truthsocial.com/@realDonaldTrump Taiwan",
    "site:truthsocial.com/@realDonaldTrump tariffs",
    "site:truthsocial.com/@realDonaldTrump trade",
    "site:truthsocial.com/@realDonaldTrump \"national security\"",
    "\"Truth Social\" \"Donald Trump\" China",
    "\"Truth Social\" Trump Taiwan",
    "\"Truth Social\" Trump tariffs",
    "\"Truth Social\" Trump \"national security\"",
    "\"Donald Trump\" \"Truth Social\" \"China\"",
    "\"Donald Trump\" \"Truth Social\" \"Taiwan\""
  ]
};
