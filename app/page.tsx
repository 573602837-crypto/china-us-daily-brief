import { ArticleCard } from "@/components/ArticleCard";
import { ManualFetchButton } from "@/components/ManualFetchButton";
import { StatsPanel } from "@/components/StatsPanel";
import { getDashboardStats, getTodayArticles } from "@/lib/news/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, stats] = await Promise.all([getTodayArticles(), getDashboardStats()]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">本地数据库网站</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">今日新闻</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              自动收集中美关系、美国内政、对华科技政策、台海、贸易关税、国会涉华议案与关键人物动态。
            </p>
          </div>
          <ManualFetchButton />
        </div>
      </section>

      <StatsPanel {...stats} />

      <section className="flex flex-col gap-4">
        {articles.length ? (
          articles.map((article) => <ArticleCard article={article} key={article.id} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            暂无今日新闻。可以点击“手动更新”，或运行 npm run fetch:daily。
          </div>
        )}
      </section>
    </main>
  );
}
