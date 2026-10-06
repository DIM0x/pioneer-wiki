"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Family, Localized, TaxonKind, TaxonLink, TaxonVersion } from "@/lib/model/types";
import { toRoman } from "@/lib/roman";
import { cn } from "@/lib/utils";

type Taxon = Family | Category;
type Selected = { kind: TaxonKind; id: string } | { kind: TaxonKind; id: null; familyId?: string };

interface Props {
  lang: "zh" | "en";
  families: Family[];
  categories: Category[];
  authors: Array<{ id: string; name: Localized }>;
  /** Entries filed under each genus, any state. */
  filed: Record<string, number>;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error?.message ?? `HTTP ${response.status}`);
  return json as T;
}

/**
 * The curators' desk: on the left the register of families and their genera,
 * as a systema; on the right the sheet of whichever taxon is open, with its
 * version history beneath. Archived taxa stay in the register, struck through.
 */
export function TaxonomyDesk({ lang, families, categories, authors, filed }: Props) {
  const zh = lang === "zh";
  const router = useRouter();
  const [selected, setSelected] = useState<Selected>({ kind: "family", id: families[0]?.id ?? null });
  const [notice, setNotice] = useState<string | null>(null);
  const current: Taxon | undefined =
    selected.id === null
      ? undefined
      : selected.kind === "family"
        ? families.find((f) => f.id === selected.id)
        : categories.find((c) => c.id === selected.id);

  return (
    <div className="grid gap-x-(--space-block) gap-y-10 lg:grid-cols-12">
      <nav aria-label={zh ? "分类登记簿" : "Register"} className="lg:col-span-4">
        <div className="lg:sticky lg:top-[calc(var(--shell-header)+1.5rem)] lg:max-h-[calc(100svh-var(--shell-header)-3rem)] lg:overflow-y-auto lg:pr-2">
          <ol className="flex flex-col gap-5">
            {families.map((f, fi) => (
              <li key={f.id} data-phylum={f.id}>
                <button
                  type="button"
                  onClick={() => setSelected({ kind: "family", id: f.id })}
                  aria-current={selected.kind === "family" && selected.id === f.id ? "true" : undefined}
                  className={cn(
                    "flex w-full items-baseline gap-3 border-b border-rule pb-1.5 text-left",
                    f.status === "archived" && "opacity-55",
                  )}
                >
                  <span className="w-8 font-display text-h4 text-phylum italic">{toRoman(fi + 1)}</span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 font-display text-lead",
                      selected.kind === "family" && selected.id === f.id ? "text-ink" : "text-ink-2",
                      f.status === "archived" && "line-through",
                    )}
                  >
                    {f.name[lang]}
                  </span>
                  <i className="font-display text-meta text-phylum-ink">{f.scientificName}</i>
                </button>
                <ul className="mt-1 pl-11">
                  {categories
                    .filter((c) => c.familyId === f.id)
                    .map((c, ci) => {
                      const on = selected.kind === "category" && selected.id === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelected({ kind: "category", id: c.id })}
                            aria-current={on ? "true" : undefined}
                            className={cn(
                              "flex w-full items-baseline gap-2 rounded-xs px-1.5 py-0.5 text-left text-small",
                              on ? "bg-ink/6 text-ink" : "text-ink-2 hover:text-ink",
                              c.status === "archived" && "line-through opacity-55",
                            )}
                          >
                            <span className="w-4 shrink-0 font-display text-ink-3 italic">{ci + 1}.</span>
                            <span className="min-w-0 flex-1 truncate">{c.name[lang]}</span>
                            <i className="shrink-0 font-display text-meta text-ink-3">{c.scientificName}</i>
                          </button>
                        </li>
                      );
                    })}
                  <li>
                    <button
                      type="button"
                      onClick={() => setSelected({ kind: "category", id: null, familyId: f.id })}
                      className="mt-0.5 px-1.5 text-meta text-phylum-ink hover:underline"
                    >
                      + {zh ? "新属" : "New genus"}
                    </button>
                  </li>
                </ul>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setSelected({ kind: "family", id: null })}
            className="mt-6 text-small text-brick-ink hover:underline"
          >
            + {zh ? "新科" : "New family"}
          </button>
        </div>
      </nav>

      <div className="min-w-0 lg:col-span-8">
        {notice ? (
          <p role="status" className="mb-3 font-mono text-meta tracking-[0.1em] text-moss-ink uppercase">
            ✓ {notice}
          </p>
        ) : null}
        <TaxonSheet
          key={`${selected.kind}:${selected.id ?? "new"}:${current?.version ?? 0}`}
          lang={lang}
          kind={selected.kind}
          taxon={current}
          newFamilyId={selected.id === null && "familyId" in selected ? selected.familyId : undefined}
          families={families}
          categories={categories}
          authors={authors}
          filedCount={current && selected.kind === "category" ? (filed[current.id] ?? 0) : undefined}
          onSaved={(id, label) => {
            setNotice(label);
            setSelected({ kind: selected.kind, id });
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

function TaxonSheet({
  lang,
  kind,
  taxon,
  newFamilyId,
  families,
  categories,
  authors,
  filedCount,
  onSaved,
}: {
  lang: "zh" | "en";
  kind: TaxonKind;
  taxon?: Taxon;
  newFamilyId?: string;
  families: Family[];
  categories: Category[];
  authors: Array<{ id: string; name: Localized }>;
  filedCount?: number;
  /** Called after a successful write with the taxon id and what happened. */
  onSaved: (id: string, label: string) => void;
}) {
  const zh = lang === "zh";
  const isNew = !taxon;
  const genus = kind === "category" ? (taxon as Category | undefined) : undefined;
  const familyId = genus?.familyId ?? newFamilyId ?? families[0]?.id;
  const family = families.find((f) => f.id === familyId);

  const [slug, setSlug] = useState(taxon?.slug ?? "");
  const [nameZh, setNameZh] = useState(taxon?.name.zh ?? "");
  const [nameEn, setNameEn] = useState(taxon?.name.en ?? "");
  const [latin, setLatin] = useState(taxon?.scientificName ?? "");
  const [latinZh, setLatinZh] = useState(taxon?.taxonNameZh ?? "");
  const [introZh, setIntroZh] = useState(taxon?.intro.zh ?? "");
  const [introEn, setIntroEn] = useState(taxon?.intro.en ?? "");
  const [essay, setEssay] = useState(taxon?.essay ?? "");
  const [links, setLinks] = useState<TaxonLink[]>(taxon?.links ?? []);
  const [leadId, setLeadId] = useState(taxon?.leadId ?? "");
  const [collaborators, setCollaborators] = useState<string[]>(taxon?.collaboratorIds ?? []);
  const [sortOrder, setSortOrder] = useState(String(taxon?.sortOrder ?? ""));
  const [moveTo, setMoveTo] = useState(familyId ?? "");
  const [representative, setRepresentative] = useState(genus?.representativeSlug ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [versions, setVersions] = useState<TaxonVersion[] | null>(null);

  useEffect(() => {
    if (!taxon) return;
    let live = true;
    send<TaxonVersion[]>(`/api/admin/taxonomy/${kind}/${taxon.id}/versions`, "GET")
      .then((v) => live && setVersions(v))
      .catch(() => live && setVersions([]));
    return () => {
      live = false;
    };
  }, [kind, taxon]);

  const badLink = useMemo(
    () =>
      links.findIndex((l) => !(l.url.startsWith("/") && !l.url.startsWith("//")) && !/^https?:\/\/\S+$/i.test(l.url)),
    [links],
  );

  async function run<T>(label: string, action: () => Promise<T>, after?: (value: T, label: string) => void) {
    setBusy(true);
    setMessage(null);
    try {
      const value = await action();
      setMessage({ kind: "ok", text: label });
      after?.(value, label);
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const patch = {
      slug: slug.trim(),
      name: { zh: nameZh.trim(), en: nameEn.trim() },
      scientificName: latin.trim(),
      taxonNameZh: latinZh.trim() || null,
      intro: { zh: introZh, en: introEn },
      essay,
      links: links.filter((l) => l.url.trim()),
      leadId: leadId || null,
      collaboratorIds: collaborators,
      ...(sortOrder.trim() ? { sortOrder: Number(sortOrder) } : {}),
      ...(kind === "category" ? { familyId: moveTo, representativeSlug: representative.trim() || null } : {}),
    };
    void run(
      zh ? "已保存并公开" : "Saved and public",
      () =>
        isNew
          ? send<TaxonVersion>(`/api/admin/taxonomy/${kind}`, "POST", { patch, note })
          : send<TaxonVersion>(`/api/admin/taxonomy/${kind}/${taxon.id}`, "PATCH", {
              patch,
              note,
              baseVersion: taxon.version,
            }),
      (v, label) => onSaved(v.taxonId, label),
    );
  }

  const archived = taxon?.status === "archived";
  const activeGenera =
    kind === "family" && taxon ? categories.filter((c) => c.familyId === taxon.id && c.status === "active").length : 0;

  return (
    <article data-phylum={family?.id ?? taxon?.id} className="pw-sheet">
      {/* ── Sheet head ───────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule px-6 py-5">
        <div className="min-w-0">
          <p className="pw-label">
            {kind === "family" ? (zh ? "大类 · 科" : "Family") : zh ? "门类 · 属" : "Genus"}
            {taxon ? ` · v${taxon.version}` : ` · ${zh ? "新建" : "new"}`}
            {archived ? ` · ${zh ? "已归档" : "archived"}` : ""}
          </p>
          <h2 className="mt-1 font-display text-h2 leading-tight">
            {taxon ? taxon.name[lang] : kind === "family" ? (zh ? "新科" : "New family") : zh ? "新属" : "New genus"}
          </h2>
          {taxon ? (
            <p className="mt-0.5 text-small text-ink-3">
              <i className="font-display text-phylum-ink">
                {genus && family ? `${family.scientificName} › ` : ""}
                {taxon.scientificName}
              </i>
              {taxon.formerSlugs.length ? (
                <span className="ml-2">
                  · {zh ? "旧 slug" : "former slugs"} {taxon.formerSlugs.join(", ")}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        {taxon ? (
          <a
            href={`/${kind === "family" ? "families" : "categories"}/${taxon.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-small text-phylum-ink hover:underline"
          >
            {zh ? "查看公开页" : "Open public page"} ↗
          </a>
        ) : null}
      </header>

      <div className="grid gap-x-8 gap-y-6 px-6 py-6 md:grid-cols-2">
        <Field label={zh ? "中文名" : "Chinese name"} value={nameZh} onChange={setNameZh} lang="zh-CN" display />
        <Field label="English name" value={nameEn} onChange={setNameEn} lang="en" display />
        <Field
          label={zh ? "学名（拉丁）" : "Scientific name"}
          value={latin}
          onChange={setLatin}
          italic
          hint={kind === "family" ? "Corvidae" : "Aphelocoma"}
        />
        <Field label={zh ? "中文科属名" : "Chinese taxon name"} value={latinZh} onChange={setLatinZh} hint="鸦科" />
        <Field
          label="Slug"
          value={slug}
          onChange={setSlug}
          mono
          hint={zh ? "改名后旧地址会 308 跳转" : "Old addresses 308 to a renamed slug"}
        />
        <Field
          label={zh ? "排序" : "Order"}
          value={sortOrder}
          onChange={setSortOrder}
          mono
          hint={zh ? "数字越小越靠前" : "Lower comes first"}
        />
        {kind === "category" ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="pw-label">{zh ? "所属科" : "Family"}</span>
              <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className="pw-field text-small">
                {families
                  .filter((f) => f.status === "active" || f.id === moveTo)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name[lang]} · {f.scientificName}
                    </option>
                  ))}
              </select>
            </label>
            <Field
              label={zh ? "代表条目（slug）" : "Representative entry (slug)"}
              value={representative}
              onChange={setRepresentative}
              mono
            />
          </>
        ) : null}
        <Field label={zh ? "简介 · 中文" : "Intro · Chinese"} value={introZh} onChange={setIntroZh} lang="zh-CN" area />
        <Field label="Intro · English" value={introEn} onChange={setIntroEn} lang="en" area />
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="pw-label">
            {zh ? "长文 · Markdown（:::zh / :::en）" : "Essay · Markdown (:::zh / :::en)"}
          </span>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            className="pw-lined min-h-44 resize-y font-mono text-small"
          />
        </label>

        {/* Lead and collaborators: credit, not permission. */}
        <label className="flex flex-col gap-1">
          <span className="pw-label">{zh ? "负责人（署名）" : "Lead (credit)"}</span>
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="pw-field text-small">
            <option value="">{zh ? "未指定" : "None"}</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name[lang]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="min-w-0">
          <legend className="pw-label">{zh ? "协作者（署名）" : "Collaborators (credit)"}</legend>
          <div className="pw-ink-under mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {authors
              .filter((a) => a.id !== leadId)
              .map((a) => (
                <label key={a.id} className="cursor-pointer text-small">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={collaborators.includes(a.id)}
                    onChange={() =>
                      setCollaborators((c) => (c.includes(a.id) ? c.filter((x) => x !== a.id) : [...c, a.id]))
                    }
                  />
                  <span className="text-ink-3 underline-offset-4 peer-checked:text-ink peer-checked:underline peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-indigo">
                    {a.name[lang]}
                  </span>
                </label>
              ))}
          </div>
        </fieldset>

        <fieldset className="md:col-span-2">
          <legend className="pw-label">
            {zh ? "相关链接（站内路径或 http/https）" : "Links (site path or http/https)"}
          </legend>
          <ol className="mt-2 flex flex-col gap-2">
            {links.map((l, i) => (
              <li key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
                <input
                  value={l.label.zh}
                  onChange={(e) =>
                    setLinks(links.map((x, j) => (j === i ? { ...x, label: { ...x.label, zh: e.target.value } } : x)))
                  }
                  placeholder="中文标签"
                  className="pw-field text-small"
                />
                <input
                  value={l.label.en}
                  onChange={(e) =>
                    setLinks(links.map((x, j) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)))
                  }
                  placeholder="English label"
                  className="pw-field text-small"
                />
                <input
                  value={l.url}
                  onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  placeholder="/entries/b-tree · https://…"
                  aria-invalid={badLink === i || undefined}
                  className={cn("pw-field font-mono text-small", badLink === i && "text-brick-ink")}
                />
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  className="pb-1 text-small text-ink-3 hover:text-brick-ink"
                >
                  {zh ? "移除" : "Remove"}
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setLinks([...links, { label: { zh: "", en: "" }, url: "" }])}
            className="mt-2 text-small text-phylum-ink hover:underline"
          >
            + {zh ? "添加链接" : "Add a link"}
          </button>
          {badLink >= 0 ? (
            <p className="mt-1 text-meta text-brick-ink">
              {zh
                ? "链接须为站内路径（/…）或 http/https 地址。"
                : "A link must be a site path (/…) or an http/https address."}
            </p>
          ) : null}
        </fieldset>
      </div>

      {/* ── Save bar ─────────────────────────────────────── */}
      <div className="pw-ink-over flex flex-wrap items-end gap-4 px-6 pb-5">
        <label className="flex min-w-56 flex-1 flex-col gap-1">
          <span className="pw-label">{zh ? "修改说明" : "Change note"}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={zh ? "这次改了什么？" : "What changed?"}
            className="pw-field text-small"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={busy || badLink >= 0}
          data-busy={busy || undefined}
          className="pw-stamp-button [--draft:var(--phylum-ink)] disabled:opacity-45"
        >
          {isNew ? (zh ? "建档 · FILE" : "File · 建档") : zh ? "保存 · SAVE" : "Save · 保存"}
        </button>
        {taxon ? (
          archived ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  zh ? "已恢复" : "Restored",
                  () =>
                    send<TaxonVersion>(`/api/admin/taxonomy/${kind}/${taxon.id}/status`, "POST", {
                      status: "active",
                      note,
                    }),
                  (_v, label) => onSaved(taxon.id, label),
                )
              }
              className="pb-1 text-small text-phylum-ink hover:underline disabled:opacity-45"
            >
              {zh ? "恢复" : "Restore"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || activeGenera > 0}
              title={
                activeGenera ? (zh ? "先归档这一科下的全部属" : "Archive every genus in the family first") : undefined
              }
              onClick={() => {
                const warn = filedCount
                  ? zh
                    ? `这一属下有 ${filedCount} 篇条目，归档后读者将看不到这一属的页面。继续？`
                    : `${filedCount} entries are filed under this genus; readers will lose its page. Continue?`
                  : zh
                    ? "归档后读者将看不到它。继续？"
                    : "Readers will no longer see it. Continue?";
                if (!window.confirm(warn)) return;
                void run(
                  zh ? "已归档" : "Archived",
                  () =>
                    send<TaxonVersion>(`/api/admin/taxonomy/${kind}/${taxon.id}/status`, "POST", {
                      status: "archived",
                      note,
                    }),
                  (_v, label) => onSaved(taxon.id, label),
                );
              }}
              className="pb-1 text-small text-brick-ink hover:underline disabled:opacity-45"
            >
              {zh ? "归档" : "Archive"}
            </button>
          )
        ) : null}
        <p
          role={message?.kind === "error" ? "alert" : "status"}
          className={cn("w-full text-meta", message?.kind === "error" ? "text-brick-ink" : "text-ink-3")}
        >
          {message?.text ?? ""}
        </p>
      </div>

      {/* ── Versions ─────────────────────────────────────── */}
      {taxon ? (
        <section aria-label={zh ? "版本记录" : "Versions"} className="border-t border-rule px-6 py-5">
          <h3 className="pw-smallcaps mb-3 text-small text-ink-3">{zh ? "版本记录" : "Versions"}</h3>
          {versions === null ? (
            <p className="text-meta text-ink-3">…</p>
          ) : (
            <ol className="flex flex-col">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule py-2 text-small last:border-0"
                >
                  <span className="w-10 font-mono text-meta text-ink">v{v.number}</span>
                  <span className="min-w-0 flex-1 text-ink-2">
                    {v.note || "—"}
                    <span className="ml-2 text-meta text-ink-3">
                      {v.data.name[lang]} · <i>{v.data.scientificName}</i> · {v.data.slug}
                      {v.data.status === "archived" ? ` · ${zh ? "已归档" : "archived"}` : ""}
                    </span>
                  </span>
                  <time dateTime={v.createdAt} className="font-mono text-meta text-ink-3">
                    {v.createdAt.slice(0, 16).replace("T", " ")}
                  </time>
                  {v.number !== taxon.version ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          zh ? `已回到 v${v.number}（记为新版本）` : `Reverted to v${v.number} (as a new version)`,
                          () =>
                            send<TaxonVersion>(`/api/admin/taxonomy/${kind}/${taxon.id}/revert`, "POST", {
                              version: v.number,
                            }),
                          (_v, label) => onSaved(taxon.id, label),
                        )
                      }
                      className="text-meta text-phylum-ink hover:underline disabled:opacity-45"
                    >
                      {zh ? "回到此版" : "Revert to this"}
                    </button>
                  ) : (
                    <span className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-3 uppercase">
                      {zh ? "当前" : "current"}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  lang,
  hint,
  area,
  mono,
  italic,
  display,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  hint?: string;
  area?: boolean;
  mono?: boolean;
  italic?: boolean;
  display?: boolean;
}) {
  const className = cn(
    "pw-field",
    mono && "font-mono text-small",
    italic && "font-display text-lead italic",
    display && "font-display text-h4",
    !mono && !italic && !display && "text-small",
  );
  return (
    <label className="flex flex-col gap-1">
      <span className="pw-label">{label}</span>
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          lang={lang}
          className={cn(className, "min-h-20 resize-y")}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          lang={lang}
          placeholder={!mono ? hint : undefined}
          className={className}
        />
      )}
      {mono && hint ? <span className="text-meta text-ink-3">{hint}</span> : null}
    </label>
  );
}
