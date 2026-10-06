import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pick } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { RunningHead } from "@/components/book/RunningHead";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";

export const metadata: Metadata = { title: "Edit 编辑条目" };

/** Opens the newest revision (which may be unpublished), not the reader-visible one. */
export default async function EditEntryPage({ params }: PageProps<"/editor/[slug]">) {
  const { slug } = await params;
  const { entries, references, taxonomy } = getServices();
  const entry = await entries.getEntry(slug);
  if (!entry) notFound();
  const { lang, t } = await getT();
  const [newest] = await entries.listRevisions(entry.id);
  const body = (newest ? await entries.getRevisionBody(newest.id) : null) ?? entry.body;
  const [sources, tags, authors, allEntries, assets, relations, families, categories] = await Promise.all([
    references.listSources(),
    references.listTags(),
    references.listAuthors(),
    entries.listEntries({ status: ["published"] }),
    references.listAssets(),
    entries.listRelations(entry.id),
    taxonomy.listFamilies(),
    taxonomy.listCategories(),
  ]);
  // The newest revision's place, which may differ from the published one while a refiling waits for review.
  const filing = newest?.taxonomy ?? {
    categoryId: entry.categoryId,
    auxiliaryCategoryIds: entry.auxiliaryCategoryIds,
    species: entry.species,
    level: entry.level,
    contentRole: entry.contentRole,
  };

  return (
    <div className="flex flex-col gap-(--space-block)">
      <RunningHead
        left={
          <Link href={`/entries/${entry.slug}`} className="no-underline hover:text-ink">
            ← {t("editor.headingEdit")} · {pick(entry.title, lang)}
          </Link>
        }
        right={entry.id}
      />
      <h1 className="sr-only">
        {t("editor.headingEdit")} — {pick(entry.title, lang)}
      </h1>
      <MarkdownEditor
        entryId={entry.id}
        initial={{
          title: entry.title,
          summary: entry.summary,
          body,
          state: newest?.state ?? entry.status,
          metadata: {
            ...filing,
            scale: entry.scale,
            role: entry.role,
            analogue: entry.analogue,
            contributorIds: entry.contributorIds,
            sourceIds: entry.sourceIds,
            tagIds: entry.tagIds,
            heroAssetId: entry.heroAssetId,
            relationDrafts: relations.map((relation) => ({
              to: relation.from === entry.id ? relation.to : relation.from,
              kind: relation.kind,
              strength: relation.strength,
              note: relation.note,
            })),
            pendingSources: [],
            pendingTags: [],
          },
        }}
        options={{ sources, tags, authors, entries: allEntries, assets, families, categories }}
        baseRevision={newest?.number ?? entry.revision}
      />
    </div>
  );
}
