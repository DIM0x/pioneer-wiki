"use client";

import { useId, useMemo, useState } from "react";
import type { Category, ContentLevel, ContentRole, Family, Lang } from "@/lib/model/types";
import { CONTENT_ROLE_IDS, CONTENT_ROLES, LEVEL_IDS, LEVELS } from "@/lib/model/vocab";
import { toRoman } from "@/lib/roman";
import { cn } from "@/lib/utils";

export interface Filing {
  categoryId?: string;
  auxiliaryCategoryIds: string[];
  species?: string;
  level?: ContentLevel;
  contentRole?: ContentRole;
}

/**
 * 编目卡 — where an entry is filed, as a catalogue card. One genus is its home
 * (主门类), chosen from the systema of the seven families; any number of other
 * genera list it as a cross-genus reference (跨属参照), which never changes its
 * family, genus or species. All of it is saved with the revision and reaches
 * readers only when that revision is published.
 */
export function FilingCard({
  value,
  onChange,
  families,
  categories,
  lang,
}: {
  value: Filing;
  onChange: (next: Filing) => void;
  families: Family[];
  categories: Category[];
  lang: Lang;
}) {
  const zh = lang === "zh";
  const ids = useId();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState<"primary" | "auxiliary" | null>(value.categoryId ? null : "primary");
  const genus = categories.find((c) => c.id === value.categoryId);
  const family = genus ? families.find((f) => f.id === genus.familyId) : undefined;
  const numeral = (f: Family) => toRoman(families.indexOf(f) + 1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return families
      .map((f) => ({
        family: f,
        genera: categories.filter(
          (c) =>
            c.familyId === f.id &&
            (!q ||
              [c.name.zh, c.name.en, c.scientificName, f.name.zh, f.name.en, f.scientificName].some((s) =>
                s.toLowerCase().includes(q),
              )),
        ),
      }))
      .filter((g) => g.genera.length);
  }, [categories, families, query]);

  const choose = (id: string) => {
    if (picking === "primary") {
      const next = categories.find((c) => c.id === id);
      // A species belongs to its genus: keep it only if it still fits.
      const species =
        value.species && next && value.species.startsWith(`${next.scientificName} `) ? value.species : undefined;
      onChange({
        ...value,
        categoryId: id,
        species,
        auxiliaryCategoryIds: value.auxiliaryCategoryIds.filter((a) => a !== id),
      });
      setPicking(null);
    } else if (picking === "auxiliary" && id !== value.categoryId && !value.auxiliaryCategoryIds.includes(id)) {
      onChange({ ...value, auxiliaryCategoryIds: [...value.auxiliaryCategoryIds, id] });
    }
    setQuery("");
  };

  const speciesOk = !value.species || !genus || value.species.startsWith(`${genus.scientificName} `);

  return (
    <section aria-labelledby={`${ids}-h`} data-phylum={family?.id} className="pw-sheet relative overflow-hidden">
      {/* Card head: the call number of the catalogue, as on a library card. */}
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
        <h2 id={`${ids}-h`} className="font-display text-h4">
          {zh ? "编目" : "Catalogue card"}
          <span className="ml-2 text-small text-ink-3">{zh ? "Catalogue card" : "编目"}</span>
        </h2>
        <span className="font-mono text-meta tracking-[0.12em] text-phylum-ink uppercase">
          {family && genus
            ? `${numeral(family)}.${categories.filter((c) => c.familyId === family.id).indexOf(genus) + 1}`
            : "—"}
          {" · "}
          {zh ? "随版本发布" : "published with the revision"}
        </span>
      </header>

      <div className="grid gap-x-8 gap-y-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* ── Primary genus ───────────────────────────────── */}
        <div className="min-w-0">
          <p className="pw-label">{zh ? "主门类 · 必填" : "Genus · required"}</p>
          {genus && family ? (
            <div className="mt-2 flex items-start gap-4">
              <span
                aria-hidden="true"
                className="font-display text-[2.75rem] leading-[0.8] text-transparent italic [-webkit-text-stroke:1px_var(--phylum)]"
              >
                {numeral(family)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-h3 leading-tight text-ink">{genus.name[lang]}</p>
                <p className="mt-0.5 text-small text-ink-3">
                  <i className="font-display text-phylum-ink">
                    {family.scientificName} › {genus.scientificName}
                  </i>{" "}
                  · {family.name[lang]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPicking(picking === "primary" ? null : "primary")}
                aria-expanded={picking === "primary"}
                className="shrink-0 text-small text-phylum-ink underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                {zh ? "改换" : "Change"}
              </button>
            </div>
          ) : (
            <p className="mt-2 font-display text-h4 text-ink-3 italic">
              {zh ? "尚未归属——从下方的属中选择一个。" : "Not yet filed — choose a genus below."}
            </p>
          )}

          <label className="mt-6 flex flex-col gap-1">
            <span className="pw-label">{zh ? "物种 · 学名" : "Species · binomial"}</span>
            <input
              value={value.species ?? ""}
              onChange={(event) => onChange({ ...value, species: event.target.value || undefined })}
              placeholder={genus ? `${genus.scientificName} …` : zh ? "先选择主门类" : "Choose a genus first"}
              disabled={!genus}
              aria-invalid={!speciesOk || undefined}
              className="pw-field font-display text-lead italic disabled:opacity-50"
            />
            <span className={cn("text-meta", speciesOk ? "text-ink-3" : "text-brick-ink")}>
              {speciesOk
                ? zh
                  ? "物种由策展确定并经 Catalogue of Life 核验；不确定时留空。"
                  : "Species are chosen by the curators and verified against Catalogue of Life; leave blank if unsure."
                : zh
                  ? `学名须以属名 ${genus?.scientificName} 开头。`
                  : `The binomial must begin with the genus ${genus?.scientificName}.`}
            </span>
          </label>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Choice
              label={zh ? "内容层级" : "Level"}
              value={value.level ?? "concept"}
              options={LEVEL_IDS.map((id) => [id, LEVELS[id][lang]])}
              onChange={(level) => onChange({ ...value, level: level as ContentLevel })}
            />
            <Choice
              label={zh ? "内容角色" : "Role"}
              value={value.contentRole ?? "foundation"}
              options={CONTENT_ROLE_IDS.map((id) => [id, CONTENT_ROLES[id][lang]])}
              onChange={(role) => onChange({ ...value, contentRole: role as ContentRole })}
            />
          </div>
        </div>

        {/* ── Cross-genus references ─────────────────────── */}
        <div className="min-w-0 lg:border-l lg:border-dashed lg:border-rule-strong lg:pl-8">
          <p className="pw-label">{zh ? "跨属参照 · 可多选" : "Cross-genus references · any number"}</p>
          <p className="mt-1 text-meta text-ink-3">
            {zh
              ? "条目会在这些属的页面上单列为参照，但仍只属于主门类。"
              : "The entry is listed as a reference on these genera, but belongs only to its own genus."}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {value.auxiliaryCategoryIds.map((id) => {
              const c = categories.find((x) => x.id === id);
              const f = c ? families.find((x) => x.id === c.familyId) : undefined;
              return (
                <li key={id} data-phylum={f?.id}>
                  <span className="inline-flex items-center gap-2 rounded-xs border border-dashed border-current px-2 py-1 text-small text-phylum-ink">
                    <span aria-hidden="true">⤳</span>
                    <span className="text-ink">{c ? c.name[lang] : id}</span>
                    {c ? <i className="font-display text-meta">{c.scientificName}</i> : null}
                    <button
                      type="button"
                      aria-label={zh ? `移除 ${c?.name.zh ?? id}` : `Remove ${c?.name.en ?? id}`}
                      onClick={() =>
                        onChange({ ...value, auxiliaryCategoryIds: value.auxiliaryCategoryIds.filter((a) => a !== id) })
                      }
                      className="-mr-1 px-1 text-ink-3 hover:text-brick-ink"
                    >
                      ×
                    </button>
                  </span>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setPicking(picking === "auxiliary" ? null : "auxiliary")}
                aria-expanded={picking === "auxiliary"}
                disabled={!genus}
                className="inline-flex items-center gap-1.5 rounded-xs border border-rule-strong px-2 py-1 text-small text-ink-2 hover:border-ink hover:text-ink disabled:opacity-45"
              >
                + {zh ? "添加参照" : "Add a reference"}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── The systema to pick from ───────────────────────── */}
      {picking ? (
        <div className="border-t border-rule bg-paper/40 px-5 pt-4 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="font-display text-lead">
              {picking === "primary"
                ? zh
                  ? "为条目选择主门类"
                  : "File the entry under a genus"
                : zh
                  ? "添加跨属参照"
                  : "Add a cross-genus reference"}
            </p>
            <label className="flex w-full max-w-xs flex-col gap-1">
              <span className="sr-only">{zh ? "筛选属" : "Filter genera"}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={zh ? "按中文名、英文名或学名筛选" : "Filter by name or Latin name"}
                className="pw-field text-small"
                autoFocus
              />
            </label>
          </div>
          <div className="mt-4 grid max-h-[26rem] gap-x-8 gap-y-5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map(({ family: f, genera }) => (
              <div key={f.id} data-phylum={f.id}>
                <p className="flex items-baseline gap-2 border-b border-rule pb-1">
                  <span className="font-display text-ink-3 italic">{numeral(f)}</span>
                  <span className="text-small text-ink">{f.name[lang]}</span>
                  <i className="ml-auto font-display text-meta text-phylum-ink">{f.scientificName}</i>
                </p>
                <ul className="mt-1">
                  {genera.map((c) => {
                    const isPrimary = c.id === value.categoryId;
                    const isAux = value.auxiliaryCategoryIds.includes(c.id);
                    const disabled = picking === "auxiliary" && (isPrimary || isAux);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => choose(c.id)}
                          disabled={disabled}
                          aria-pressed={picking === "primary" ? isPrimary : isAux}
                          className={cn(
                            "flex w-full items-baseline gap-2 rounded-xs px-1.5 py-1 text-left text-small transition-colors duration-(--dur-quick)",
                            "hover:bg-ink/5 disabled:cursor-default disabled:opacity-40",
                            (picking === "primary" ? isPrimary : isAux) && "bg-ink/5",
                          )}
                        >
                          <span className="min-w-0 flex-1 text-ink">{c.name[lang]}</span>
                          <i className="shrink-0 font-display text-meta text-ink-3">{c.scientificName}</i>
                          {isPrimary ? (
                            <span className="shrink-0 font-mono text-[0.625rem] tracking-[0.12em] text-phylum-ink uppercase">
                              {zh ? "主" : "home"}
                            </span>
                          ) : isAux ? (
                            <span aria-hidden="true" className="shrink-0 text-phylum-ink">
                              ⤳
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {matches.length === 0 ? (
              <p className="text-small text-ink-3 italic">{zh ? "没有匹配的属。" : "No genus matches."}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** A small set of choices drawn as typed words on a ledger line, the current one underlined. */
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="pw-label">{label}</legend>
      <div className="pw-ink-under mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {options.map(([id, text]) => (
          <label key={id} className="cursor-pointer">
            <input
              type="radio"
              className="peer sr-only"
              checked={value === id}
              onChange={() => onChange(id)}
              name={label}
            />
            <span className="text-small text-ink-3 decoration-phylum underline-offset-4 peer-checked:text-ink peer-checked:underline peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-indigo hover:text-ink">
              {text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
