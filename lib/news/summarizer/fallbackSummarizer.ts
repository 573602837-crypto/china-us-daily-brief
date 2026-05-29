import { trimText } from "@/lib/news/text";
import type { RawArticleCandidate, SummaryResult } from "@/lib/news/types";

const TERM_MAP: Array<[RegExp, string]> = [
  [/\bthe white house\b/gi, "白宫"],
  [/\bstate department\b/gi, "美国国务院"],
  [/\btreasury\b/gi, "美国财政部"],
  [/\bpentagon\b/gi, "五角大楼"],
  [/\bdepartment of defense\b/gi, "美国国防部"],
  [/\bcongress\b/gi, "美国国会"],
  [/\bsenate\b/gi, "参议院"],
  [/\bhouse\b/gi, "众议院"],
  [/\brepublicans\b/gi, "共和党人"],
  [/\bdemocrats\b/gi, "民主党人"],
  [/\bdonald trump\b/gi, "特朗普"],
  [/\bjoe biden\b/gi, "拜登"],
  [/\bkamala harris\b/gi, "哈里斯"],
  [/\bchina\b/gi, "中国"],
  [/\bchinese\b/gi, "中国"],
  [/\bbeijing\b/gi, "北京"],
  [/\btaiwan\b/gi, "台湾"],
  [/\bsemiconductor(s)?\b/gi, "半导体"],
  [/\bchip(s)?\b/gi, "芯片"],
  [/\bexport controls\b/gi, "出口管制"],
  [/\btariff(s)?\b/gi, "关税"],
  [/\btrade\b/gi, "贸易"],
  [/\bsupply chain(s)?\b/gi, "供应链"],
  [/\bnational security\b/gi, "国家安全"],
  [/\belection\b/gi, "选举"],
  [/\bpolicy\b/gi, "政策"],
  [/\bbill\b/gi, "法案"]
];

function translateKnownTerms(input: string): string {
  let output = input
    .replace(/\([^)]+(reuters|ap|afp)[^)]+\)/gi, " ")
    .replace(/\bby\s+[A-Z][A-Za-z.\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of TERM_MAP) {
    output = output.replace(pattern, replacement);
  }

  return output
    .replace(/\s*[,/]\s*/g, "，")
    .replace(/\s*:\s*/g, "：")
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/g, "")
    .trim();
}

export function buildFallbackSummary(candidate: RawArticleCandidate): SummaryResult {
  const summaryBasis = "基于标题/摘要生成" as const;
  const titleZh = trimText(translateKnownTerms(candidate.originalTitle), 58);
  const sourceText = candidate.rawDescription || candidate.contentSnippet || candidate.originalTitle;
  const translated = trimText(translateKnownTerms(sourceText), 150);
  const summaryZh = translated
    ? `${summaryBasis}：${translated}`
    : `${summaryBasis}：原文标题显示，该报道涉及“${titleZh}”。`;

  return {
    chineseTitle: titleZh || candidate.originalTitle,
    summaryZh,
    summaryBasis
  };
}
