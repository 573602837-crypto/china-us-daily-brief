import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/ArticleCard";
import { getArticles, getPerson } from "@/lib/news/queries";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [person, articles] = await Promise.all([
    getPerson(id),
    getArticles({ person: id, limit: 120 })
  ]);

  if (!person) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">{person.team}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{person.nameZh}</h1>
        <p className="mt-1 text-slate-600">{person.nameEn}</p>
        <p className="mt-3 text-sm text-slate-500">别名：{person.aliases.join(" / ")}</p>
      </section>

      {articles.map((article) => (
        <ArticleCard article={article} key={article.id} />
      ))}
      {!articles.length ? <div className="rounded-lg bg-white p-8 text-center text-slate-600">暂无相关新闻。</div> : null}
    </main>
  );
}
