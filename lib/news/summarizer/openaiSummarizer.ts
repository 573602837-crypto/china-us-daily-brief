import { appConfig } from "@/lib/settings";
import type { RawArticleCandidate, SummaryResult } from "@/lib/news/types";

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") {
        return text;
      }
    }
  }

  return "";
}

function parseSummaryJson(text: string): SummaryResult | null {
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] || "";

  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<SummaryResult>;
    if (!parsed.chineseTitle || !parsed.summaryZh) {
      return null;
    }

    return {
      chineseTitle: parsed.chineseTitle,
      summaryZh: parsed.summaryZh,
      summaryBasis: "基于标题/摘要生成"
    };
  } catch {
    return null;
  }
}

export async function buildOpenAISummary(candidate: RawArticleCandidate): Promise<SummaryResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const publicText = [
    `Source: ${candidate.sourceName}`,
    `Title: ${candidate.originalTitle}`,
    `Description: ${candidate.rawDescription || ""}`,
    `Public snippet: ${candidate.contentSnippet || ""}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: appConfig.openaiModel,
      input: [
        {
          role: "system",
          content:
            "你是严谨的中文新闻摘要助手。只根据用户提供的公开文本生成保守、准确、简洁的中文标题和摘要，不添加原文没有的信息。"
        },
        {
          role: "user",
          content: `请返回 JSON：{"chineseTitle":"...","summaryZh":"..."}。\n只能基于标题、RSS description、Google News snippet 或 GDELT 公开摘要生成，不要加入原文没有的信息。\n\n${publicText}`
        }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return parseSummaryJson(extractOutputText(data));
}
