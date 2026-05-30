import { NextRequest, NextResponse } from "next/server";

import { appConfig } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type GitHubTriggerConfig = {
  token: string;
  repository: string;
  workflow: string;
  ref: string;
};

function isAuthorized(request: NextRequest): boolean {
  if (!appConfig.cronSecret || process.env.NODE_ENV !== "production") {
    return true;
  }

  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken = request.nextUrl.searchParams.get("secret");

  return headerToken === appConfig.cronSecret || queryToken === appConfig.cronSecret;
}

function getGitHubTriggerConfig(): GitHubTriggerConfig | null {
  const token = process.env.GITHUB_ACTIONS_TRIGGER_TOKEN || "";
  const repository = process.env.GITHUB_ACTIONS_REPOSITORY || process.env.GITHUB_REPOSITORY || "";

  if (!token || !repository) {
    return null;
  }

  return {
    token,
    repository,
    workflow: process.env.GITHUB_ACTIONS_WORKFLOW || "daily-news.yml",
    ref: process.env.GITHUB_ACTIONS_REF || "main"
  };
}

async function triggerGitHubWorkflow(config: GitHubTriggerConfig) {
  const response = await fetch(
    `https://api.github.com/repos/${config.repository}/actions/workflows/${config.workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "User-Agent": "ChinaUSDailyBriefBot/0.1",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({ ref: config.ref })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub Actions 触发失败：HTTP ${response.status} ${body.slice(0, 240)}`);
  }
}

export async function POST(request: NextRequest) {
  const githubConfig = getGitHubTriggerConfig();

  if (githubConfig && process.env.NODE_ENV === "production") {
    try {
      await triggerGitHubWorkflow(githubConfig);
      return NextResponse.json({
        ok: true,
        queued: true,
        status: "queued",
        message: "已触发 GitHub Actions 抓取任务。任务完成并提交 JSON 后，EdgeOne 重新部署即可看到新数据。"
      });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "GitHub Actions 触发失败"
        },
        { status: 502 }
      );
    }
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "当前部署环境未授权直接抓取。若要让线上按钮触发更新，请配置 GITHUB_ACTIONS_TRIGGER_TOKEN 与 GITHUB_ACTIONS_REPOSITORY；本地仍可运行 npm run fetch:daily。"
      },
      { status: 401 }
    );
  }

  try {
    const { runDailyPipeline } = await import("@/lib/news/pipeline");
    const result = await runDailyPipeline();
    const status = result.status === "failed" ? 500 : 200;

    return NextResponse.json({ ok: result.status !== "failed", ...result }, { status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "抓取任务运行失败"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
