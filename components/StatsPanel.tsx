export function StatsPanel({
  dateKey,
  total,
  topicCounts,
  peopleCounts
}: {
  dateKey: string;
  total: number;
  topicCounts: Array<[string, number]>;
  peopleCounts: Array<[string, number]>;
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_2fr_2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">今日日期</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{dateKey}</p>
        <p className="mt-1 text-sm text-slate-600">今日新闻总数：{total}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">各主题数量</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topicCounts.length ? (
            topicCounts.map(([label, count]) => (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-700" key={label}>
                {label} {count}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">暂无数据</span>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">重点人物出现次数</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {peopleCounts.length ? (
            peopleCounts.map(([label, count]) => (
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-700" key={label}>
                {label} {count}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">暂无人物匹配</span>
          )}
        </div>
      </div>
    </section>
  );
}
