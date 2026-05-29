import Link from "next/link";

import { TOPICS } from "@/config/topics";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles } from "@/lib/news/queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TopicsPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const selectedTopic = valueOf(params.topic) || TOPICS[0].id;
  const articles = await getArticles({ topic: selectedTopic, limit: 120 });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">主题页</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Link
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                topic.id === selectedTopic
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              href={`/topics?topic=${topic.id}`}
              key={topic.id}
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </section>

      {articles.map((article) => (
        <ArticleCard article={article} key={article.id} />
      ))}
      {!articles.length ? <div className="rounded-lg bg-white p-8 text-center text-slate-600">该主题暂无新闻。</div> : null}
    </main>
  );
}
