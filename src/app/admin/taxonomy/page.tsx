import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServices } from "@/lib/services";
import { getT } from "@/lib/i18n/server";
import { RunningHead } from "@/components/book/RunningHead";
import { TaxonomyDesk } from "@/components/admin/TaxonomyDesk";

export const metadata: Metadata = { title: "分类管理 Catalogue", robots: { index: false } };

/**
 * 分类管理 — the curators' register of families and genera. Administrators
 * only; saving is public at once, every change is kept as a version, and a
 * taxon can be archived and restored but never deleted.
 */
export default async function TaxonomyAdminPage() {
  const { auth, taxonomy, references, entries } = getServices();
  const account = await auth.getCurrentAccount();
  if (!account || account.role !== "admin") notFound();
  const { lang } = await getT();
  const zh = lang === "zh";
  const [families, categories, authors, all] = await Promise.all([
    taxonomy.listFamilies({ includeArchived: true }),
    taxonomy.listCategories({ includeArchived: true }),
    references.listAuthors(),
    entries.listEntries(),
  ]);
  // Genus → how many entries are filed under it (any state), so archiving warns before hiding live work.
  const filed: Record<string, number> = {};
  for (const e of all) filed[e.categoryId] = (filed[e.categoryId] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-(--space-block)">
      <RunningHead
        left={
          <>
            <Link href="/admin" className="no-underline hover:text-ink">
              {zh ? "管理后台" : "Admin"}
            </Link>{" "}
            · {zh ? "分类管理" : "Catalogue"}
          </>
        }
        right={`${families.length} ${zh ? "科" : "families"} · ${categories.length} ${zh ? "属" : "genera"}`}
      />
      <header className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-mono text-meta tracking-[0.14em] text-brick-ink uppercase">Curators&rsquo; register</p>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-none">
            {zh ? "分类管理" : "The catalogue"}
          </h1>
          <p className="mt-4 max-w-prose text-small leading-relaxed text-ink-2">
            {zh
              ? "科与属在这里编目。保存后立即公开，每次修改都留下一版，可随时回到旧版；分类只能归档与恢复，不能删除。负责人与协作者用于署名，不改变编辑权限。"
              : "Families and genera are catalogued here. Saving is public at once; every change is kept as a version you can return to. Taxa can be archived and restored, never deleted. Leads and collaborators are credited; they do not change who may edit."}
          </p>
        </div>
      </header>
      <TaxonomyDesk
        lang={lang}
        families={families}
        categories={categories}
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
        filed={filed}
      />
    </div>
  );
}
