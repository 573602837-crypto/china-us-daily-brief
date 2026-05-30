import type { ArticleView } from "@/lib/news/types";

function Importance({ level }: { level: number }) {
  return (
    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
      重要性 {level}/5
    </span>
  );
}

export function ArticleCard({ article }: { article: ArticleView }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">{article.sourceName}</span>
        <span>{article.sourceDomain}</span>
        <span>{article.providerName}</span>
        <span>{article.publishedAt}</span>
        <span>摘要依据：{article.summaryBasis}</span>
        <Importance level={article.importanceLevel} />
        {article.chinaRelated ? (
          <span className="rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700">涉华</span>
        ) : null}
      </div>

      <h2 className="mt-3 text-lg font-bold leading-snug text-slate-950">{article.chineseTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{article.summaryZh}</p>

      <div className="mt-3 rounded-md bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">英文原文标题</p>
        <p className="mt-1 text-sm leading-6 text-slate-800">{article.originalTitle}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {article.topicLabels.map((label) => (
          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700" key={label}>
            {label}
          </span>
        ))}
        {article.peopleMatches.map((person) => (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700" key={`${person.personId}-${person.matchedAlias}`}>
            {person.nameZh} · {person.matchedAlias} · {person.confidence}
          </span>
        ))}
        {article.relatedEntityTags.map((entity) => (
          <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700" key={entity}>
            {entity}
          </span>
        ))}
      </div>

      <a
        className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
        href={article.originalUrl}
        rel="noreferrer"
        target="_blank"
      >
        打开英文原文
      </a>
    </article>
  );
}
