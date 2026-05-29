export type TrackedPerson = {
  id: string;
  nameEn: string;
  nameZh: string;
  team: "特朗普团队 / 共和党政策网络" | "民主党重点人物";
  aliases: string[];
  priority?: boolean;
  enabled?: boolean;
};

export const TRACKED_PEOPLE: TrackedPerson[] = [
  {
    id: "donald-trump",
    nameEn: "Donald Trump",
    nameZh: "唐纳德·特朗普",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Donald Trump", "Trump"],
    priority: true
  },
  {
    id: "jd-vance",
    nameEn: "JD Vance",
    nameZh: "JD·万斯",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["JD Vance", "J.D. Vance", "James David Vance", "Vance"],
    priority: true
  },
  {
    id: "marco-rubio",
    nameEn: "Marco Rubio",
    nameZh: "马尔科·鲁比奥",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Marco Rubio", "Rubio"],
    priority: true
  },
  {
    id: "pete-hegseth",
    nameEn: "Pete Hegseth",
    nameZh: "皮特·赫格塞思",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Pete Hegseth", "Hegseth"]
  },
  {
    id: "scott-bessent",
    nameEn: "Scott Bessent",
    nameZh: "斯科特·贝森特",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Scott Bessent", "Bessent"]
  },
  {
    id: "howard-lutnick",
    nameEn: "Howard Lutnick",
    nameZh: "霍华德·卢特尼克",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Howard Lutnick", "Lutnick"]
  },
  {
    id: "mike-johnson",
    nameEn: "Mike Johnson",
    nameZh: "迈克·约翰逊",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Mike Johnson", "Speaker Mike Johnson"]
  },
  {
    id: "john-thune",
    nameEn: "John Thune",
    nameZh: "约翰·图恩",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["John Thune", "Thune"]
  },
  {
    id: "elise-stefanik",
    nameEn: "Elise Stefanik",
    nameZh: "伊莉斯·斯特凡尼克",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Elise Stefanik", "Stefanik"]
  },
  {
    id: "robert-lighthizer",
    nameEn: "Robert Lighthizer",
    nameZh: "罗伯特·莱特希泽",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Robert Lighthizer", "Bob Lighthizer", "Lighthizer"],
    priority: true
  },
  {
    id: "stephen-miller",
    nameEn: "Stephen Miller",
    nameZh: "斯蒂芬·米勒",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Stephen Miller", "Stephen K. Miller", "Stephen K Miller"],
    priority: true
  },
  {
    id: "michael-needham",
    nameEn: "Michael Needham",
    nameZh: "迈克尔·尼达姆",
    team: "特朗普团队 / 共和党政策网络",
    aliases: [
      "Michael Needham",
      "Mike Needham",
      "Michael Mike Needham",
      "Michael \"Mike\" Needham",
      "Michael “Mike” Needham",
      "Michael 'Mike' Needham",
      "Michael ‘Mike’ Needham"
    ],
    priority: true
  },
  {
    id: "susie-wiles",
    nameEn: "Susie Wiles",
    nameZh: "苏茜·怀尔斯",
    team: "特朗普团队 / 共和党政策网络",
    aliases: ["Susie Wiles", "Wiles"]
  },
  {
    id: "gavin-newsom",
    nameEn: "Gavin Newsom",
    nameZh: "加文·纽森",
    team: "民主党重点人物",
    aliases: ["Gavin Newsom", "Newsom"]
  },
  {
    id: "jake-sullivan",
    nameEn: "Jake Sullivan",
    nameZh: "杰克·沙利文",
    team: "民主党重点人物",
    aliases: ["Jake Sullivan", "Sullivan"]
  },
  {
    id: "joe-biden",
    nameEn: "Joe Biden",
    nameZh: "乔·拜登",
    team: "民主党重点人物",
    aliases: ["Joe Biden", "President Biden", "Biden"],
    priority: true
  },
  {
    id: "kamala-harris",
    nameEn: "Kamala Harris",
    nameZh: "卡玛拉·哈里斯",
    team: "民主党重点人物",
    aliases: ["Kamala Harris", "Vice President Harris", "Harris"],
    priority: true
  },
  {
    id: "antony-blinken",
    nameEn: "Antony Blinken",
    nameZh: "安东尼·布林肯",
    team: "民主党重点人物",
    aliases: ["Antony Blinken", "Tony Blinken", "Blinken"]
  },
  {
    id: "chuck-schumer",
    nameEn: "Chuck Schumer",
    nameZh: "查克·舒默",
    team: "民主党重点人物",
    aliases: ["Chuck Schumer", "Schumer"]
  },
  {
    id: "hakeem-jeffries",
    nameEn: "Hakeem Jeffries",
    nameZh: "哈基姆·杰弗里斯",
    team: "民主党重点人物",
    aliases: ["Hakeem Jeffries", "Jeffries"]
  },
  {
    id: "nancy-pelosi",
    nameEn: "Nancy Pelosi",
    nameZh: "南希·佩洛西",
    team: "民主党重点人物",
    aliases: ["Nancy Pelosi", "Pelosi"]
  }
];
