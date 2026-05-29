import { NextResponse } from "next/server";

import { getArticles } from "@/lib/news/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const articles = await getArticles({
    date: url.searchParams.get("date") || undefined,
    topic: url.searchParams.get("topic") || undefined,
    source: url.searchParams.get("source") || undefined,
    person: url.searchParams.get("person") || undefined,
    q: url.searchParams.get("q") || undefined,
    limit: Number(url.searchParams.get("limit") || "100")
  });

  return NextResponse.json({ ok: true, articles });
}
