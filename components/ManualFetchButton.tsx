"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualFetchButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "queued" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runFetch() {
    setStatus("running");
    setMessage("正在抓取公开 RSS、Google News RSS 和 GDELT...");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 65000);

    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        signal: controller.signal
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `抓取失败：HTTP ${response.status}`);
      }

      if (data.queued) {
        setStatus("queued");
        setMessage(data.message || "已触发云端抓取任务，稍后等待 GitHub Actions 更新数据。");
        return;
      }

      setStatus("done");
      setMessage(`完成：抓取 ${data.totalFetched} 条，保存 ${data.totalSaved} 条，跳过 ${data.totalSkipped} 条。`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      if (error instanceof SyntaxError) {
        setMessage("抓取接口没有返回 JSON。请检查 EdgeOne 是否启用了 Next.js API 路由，或改用 GitHub Actions 手动触发。");
      } else if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("抓取请求超时。线上环境建议让按钮触发 GitHub Actions，或直接在 GitHub Actions 页面手动运行。");
      } else {
        setMessage(error instanceof Error ? error.message : "抓取失败");
      }
    } finally {
      window.clearTimeout(timeout);
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
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
