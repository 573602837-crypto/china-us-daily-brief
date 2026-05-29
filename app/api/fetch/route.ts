import { NextRequest, NextResponse } from "next/server";

import { runDailyPipeline } from "@/lib/news/pipeline";
import { appConfig } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  if (!appConfig.cronSecret || process.env.NODE_ENV !== "production") {
    return true;
  }

  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken = request.nextUrl.searchParams.get("secret");

  return headerToken === appConfig.cronSecret || queryToken === appConfig.cronSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyPipeline();
  const status = result.status === "failed" ? 500 : 200;

  return NextResponse.json({ ok: result.status !== "failed", ...result }, { status });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
