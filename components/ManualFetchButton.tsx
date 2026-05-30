export function ManualFetchButton() {
  return (
    <div className="flex flex-col gap-2 sm:items-center">
      <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        每天 07:00 自动更新
      </span>
      <p className="text-sm text-slate-600">由 GitHub Actions 抓取公开来源并提交数据。</p>
    </div>
  );
}
