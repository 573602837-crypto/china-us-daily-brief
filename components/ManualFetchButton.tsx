"use client";

import { useState } from "react";

export function ManualFetchButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runFetch() {
    setStatus("running");
    setMessage("正在抓取公开 RSS、Google News RSS 和 GDELT...");

    try {
      const response = await fetch("/api/fetch", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "抓取失败");
      }

      setStatus("done");
      setMessage(`完成：抓取 ${data.totalFetched} 条，保存 ${data.totalSaved} 条，跳过 ${data.totalSkipped} 条。`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "抓取失败");
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={runFetch}
        disabled={status === "running"}
        className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {status === "running" ? "正在更新" : "手动更新"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
