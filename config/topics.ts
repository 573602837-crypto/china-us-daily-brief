export const TOPICS = [
  {
    id: "us_china_relations",
    label: "中美关系",
    keywords: [
      "u.s.-china",
      "us-china",
      "china",
      "beijing",
      "xi jinping",
      "chinese communist party",
      "ccp",
      "bilateral",
      "diplomacy"
    ]
  },
  {
    id: "us_domestic",
    label: "美国内政",
    keywords: [
      "white house",
      "congress",
      "senate",
      "house republicans",
      "house democrats",
      "administration",
      "election",
      "campaign",
      "democrats",
      "republicans",
      "supreme court"
    ]
  },
  {
    id: "china_tech_policy",
    label: "对华科技政策",
    keywords: [
      "technology",
      "ai",
      "artificial intelligence",
      "semiconductor",
      "chip",
      "chips",
      "export controls",
      "advanced computing",
      "huawei",
      "tiktok",
      "bytedance"
    ]
  },
  {
    id: "taiwan",
    label: "台海",
    keywords: ["taiwan", "taiwan strait", "strait", "lai ching-te", "taipei", "cross-strait"]
  },
  {
    id: "trade_tariffs",
    label: "贸易与关税",
    keywords: [
      "tariff",
      "tariffs",
      "trade",
      "supply chain",
      "supply chains",
      "manufacturing",
      "imports",
      "exports",
      "customs"
    ]
  },
  {
    id: "congress_china",
    label: "国会涉华议案",
    keywords: [
      "china bill",
      "select committee on china",
      "house china committee",
      "congress",
      "senate",
      "legislation",
      "bill",
      "amendment",
      "hearing"
    ]
  },
  {
    id: "key_figures",
    label: "关键人物",
    keywords: [
      "donald trump",
      "jd vance",
      "marco rubio",
      "stephen miller",
      "mike needham",
      "gavin newsom",
      "joe biden",
      "kamala harris"
    ]
  },
  {
    id: "other_related",
    label: "其他相关",
    keywords: [
      "national security",
      "state department",
      "treasury",
      "pentagon",
      "defense department",
      "foreign policy"
    ]
  }
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

export const TOPIC_LABELS: Record<TopicId, string> = Object.fromEntries(
  TOPICS.map((topic) => [topic.id, topic.label])
) as Record<TopicId, string>;
