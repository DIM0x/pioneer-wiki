import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { RunningHead } from "@/components/book/RunningHead";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";

export const metadata: Metadata = { title: "New entry 新建条目" };

const TEMPLATE = `:::zh
用一两句话说明它是什么。
:::

:::en
Say what it is in a sentence or two.
:::

## 结构 | Structure
`;

/** ?genus=<slug> files the new entry there from the start (linked from an empty genus page). */
export default async function NewEntryPage({ searchParams }: PageProps<"/editor/new">) {
  const { genus } = await searchParams;
  const { t } = await getT();
  const { entries, references, taxonomy } = getServices();
  const [sources, tags, authors, allEntries, assets, families, categories] = await Promise.all([
    references.listSources(),
    references.listTags(),
    references.listAuthors(),
    entries.listEntries({ status: ["published"] }),
    references.listAssets(),
    taxonomy.listFamilies(),
    taxonomy.listCategories(),
  ]);
  const start = typeof genus === "string" ? categories.find((c) => c.slug === genus || c.id === genus) : undefined;
  return (
    <div className="flex flex-col gap-(--space-block)">
      <RunningHead left={`${t("site.name")} · ${t("editor.headingNew")}`} right="PW-····" />
      <h1 className="sr-only">{t("editor.headingNew")}</h1>
      <MarkdownEditor
        initial={{
          title: { zh: "", en: "" },
          summary: { zh: "", en: "" },
          body: TEMPLATE,
          state: "draft",
          metadata: start ? { categoryId: start.id } : undefined,
        }}
        options={{ sources, tags, authors, entries: allEntries, assets, families, categories }}
      />
    </div>
  );
}
