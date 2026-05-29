import Link from "next/link";

import { getPeople } from "@/lib/news/queries";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">人物追踪</h1>
        <p className="mt-2 text-sm text-slate-600">
          人物名单来自 config/people.ts，可继续增删。匹配结果会保留 matchedAlias 和 confidence。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400"
            href={`/people/${person.id}`}
            key={person.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{person.nameZh}</h2>
                <p className="text-sm text-slate-600">{person.nameEn}</p>
              </div>
              {person.priority ? (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">重点</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-600">{person.team}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              别名：{person.aliases.slice(0, 5).join(" / ")}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">相关新闻 {person.matches.length} 条</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
