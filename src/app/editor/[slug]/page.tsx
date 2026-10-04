import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { RunningHead } from "@/components/book/RunningHead";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";

export const metadata: Metadata = { title: "Edit 编辑条目" };

/** Opens the newest revision (which may be unpublished), not the reader-visible one. */
export default async function EditEntryPage({ params }: PageProps<"/editor/[slug]">) {
  const { slug } = await params;
  const { entries } = getServices();
  const entry = await entries.getEntry(slug);
  if (!entry) notFound();
  const { t } = await getT();
  const [newest] = await entries.listRevisions(entry.id);
  const body = (newest ? await entries.getRevisionBody(newest.id) : null) ?? entry.body;

  return (
    <div className="flex flex-col gap-(--space-block)">
      <RunningHead
        left={
          <Link href={`/entries/${entry.slug}`} className="no-underline hover:text-ink">
            ← {t("editor.headingEdit")} · {entry.title.en}
          </Link>
        }
        right={entry.id}
      />
      <h1 className="sr-only">
        {t("editor.headingEdit")} — {entry.title.en}
      </h1>
      <MarkdownEditor
        entryId={entry.id}
        initial={{ title: entry.title, summary: entry.summary, body, state: newest?.state ?? entry.status }}
        baseRevision={newest?.number ?? entry.revision}
      />
    </div>
  );
}
