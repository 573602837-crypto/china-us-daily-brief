import Link from "next/link";

import { ArticleCard } from "@/components/ArticleCard";
import { getArticles, getAvailableDates } from "@/lib/news/queries";
import { formatDateKey } from "@/lib/news/text";
import { appConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ArchivePage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const selectedDate = valueOf(params.date) || formatDateKey(new Date(), appConfig.timezone);
  const [dates, articles] = await Promise.all([
    getAvailableDates(),
    getArticles({ date: selectedDate, limit: 120 })
  ]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">历史归档</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set([selectedDate, ...dates])).map((date) => (
            <Link
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                date === selectedDate
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              href={`/archive?date=${date}`}
              key={date}
            >
              {date}
            </Link>
          ))}
        </div>
      </section>

      {articles.map((article) => (
        <ArticleCard article={article} key={article.id} />
      ))}
      {!articles.length ? <div className="rounded-lg bg-white p-8 text-center text-slate-600">该日期暂无新闻。</div> : null}
    </main>
  );
}
