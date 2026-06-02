import Link from "next/link";
import { getRecentRuns, getSourceStatus } from "@/lib/news/queries";
import { appConfig } from "@/lib/settings";
import { formatDateKey } from "@/lib/news/text";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) {
    return "尚未抓取";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export default async function SourcesPage() {
  const [sources, runs] = await Promise.all([getSourceStatus(), getRecentRuns()]);
  const todayDate = formatDateKey(new Date(), appConfig.timezone);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">来源状态</h1>
        <p className="mt-2 text-sm text-slate-600">
          当前只展示主来源清单；抓取仍只使用公开 RSS、Google News RSS 和 GDELT 公开接口。
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">来源</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">今日</th>
                <th className="px-4 py-3">最近抓取</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">直接</th>
                <th className="px-4 py-3">索引</th>
                <th className="px-4 py-3">相关</th>
                <th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-slate-900 hover:text-slate-600"
                      href={{
                        pathname: "/search",
                        query: {
                          date: todayDate,
                          source: source.domain
                        }
                      }}
                    >
                      {source.name}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{source.domain}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{source.type}</td>
                  <td className="px-4 py-3">
                    <Link
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={{
                        pathname: "/search",
                        query: {
                          date: todayDate,
                          source: source.domain
                        }
                      }}
                    >
                      今日新闻
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(source.lastFetchedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        source.lastFetchStatus === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : source.lastFetchStatus === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {source.lastFetchStatus || "未运行"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{source.directSourceHits}</td>
                  <td className="px-4 py-3 text-slate-600">{source.indexedSourceHits}</td>
                  <td className="px-4 py-3 text-slate-600">{source.relatedEntityHits}</td>
                  <td className="max-w-md px-4 py-3 text-slate-600">
                    <div>{source.lastFetchMessage || source.notes || source.rssUrl || "公开来源"}</div>
                    <a className="mt-1 inline-block text-xs font-semibold text-slate-500" href={source.homepageUrl} rel="noreferrer" target="_blank">
                      官网
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">最近抓取日志</h2>
        <div className="mt-4 grid gap-3">
          {runs.map((run) => (
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700" key={`${run.runDate}-${run.endedAt}`}>
              {run.runDate} · {run.status} · fetched {run.totalFetched} · saved {run.totalSaved} · skipped {run.totalSkipped}
            </div>
          ))}
          {!runs.length ? <p className="text-sm text-slate-500">暂无抓取日志。</p> : null}
        </div>
      </section>
    </main>
  );
}
