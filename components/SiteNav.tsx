import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "今日" },
  { href: "/archive", label: "归档" },
  { href: "/topics", label: "主题" },
  { href: "/people", label: "人物" },
  { href: "/sources", label: "来源" },
  { href: "/search", label: "搜索" }
];

export function SiteNav() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">Daily News Database</p>
          <h1 className="truncate text-lg font-bold text-slate-950">中美关系与美国政治动态每日简报</h1>
        </Link>
        <div className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
