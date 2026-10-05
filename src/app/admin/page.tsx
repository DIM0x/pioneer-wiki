import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServices } from "@/lib/services";
import { RunningHead } from "@/components/book/RunningHead";
import { ReviewQueue } from "@/components/admin/ReviewQueue";

export const metadata: Metadata = { title: "管理后台 Admin", robots: { index: false } };

export default async function AdminPage() {
  const account = await getServices().auth.getCurrentAccount();
  if (!account || account.role !== "admin") notFound();
  const entries = await getServices().entries.listEntries({ status: ["in_review"] });
  const items = await Promise.all(entries.map(async (entry) => ({ entry, revisions: await getServices().entries.listRevisions(entry.id) })));
  return <div className="flex flex-col gap-(--space-block)">
    <RunningHead left="先锋维基 · 管理后台" right={`待处理 ${items.length}`} />
    <header><p className="font-mono text-meta tracking-[0.14em] text-brick-ink uppercase">Editorial office</p><h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-none">管理后台</h1><p className="mt-4 max-w-prose text-small leading-relaxed text-ink-2">在这里审核条目、回滚公开版本，并继续扩展作者、成员、来源、标签、关系、用户和论坛管理。</p></header>
    <section aria-labelledby="review-heading"><h2 id="review-heading" className="mb-4 font-display text-h2">审核队列</h2><ReviewQueue items={items} /></section>
  </div>;
}
