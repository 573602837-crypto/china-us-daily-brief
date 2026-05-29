import { ArticleCard } from "@/components/ArticleCard";
import { TOPICS } from "@/config/topics";
import { getArticles, getPeople, getSourceNames } from "@/lib/news/queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const q = valueOf(params.q) || "";
  const topic = valueOf(params.topic) || "";
  const source = valueOf(params.source) || "";
  const person = valueOf(params.person) || "";
  const [sources, people, articles] = await Promise.all([
    getSourceNames(),
    getPeople(),
    getArticles({
      q: q || undefined,
      topic: topic || undefined,
      source: source || undefined,
      person: person || undefined,
      limit: 120
    })
  ]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">搜索</h1>
        <form className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]" action="/search">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="q"
            placeholder="关键词"
            defaultValue={q}
          />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" name="topic" defaultValue={topic}>
            <option value="">全部主题</option>
            {TOPICS.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" name="source" defaultValue={source}>
            <option value="">全部来源</option>
            {sources.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" name="person" defaultValue={person}>
            <option value="">全部人物</option>
            {people.map((item) => (
              <option value={item.id} key={item.id}>
                {item.nameZh}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">
            搜索
          </button>
        </form>
      </section>

      {articles.map((article) => (
        <ArticleCard article={article} key={article.id} />
      ))}
      {!articles.length ? <div className="rounded-lg bg-white p-8 text-center text-slate-600">暂无匹配结果。</div> : null}
    </main>
  );
}
