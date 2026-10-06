#!/usr/bin/env node
/**
 * Imports the museum articles from the curation package into the mock content:
 *
 *   node tools/import-museum-articles.mjs [package-dir]   (default handoff/museum-upgrade)
 *
 * Only articles the maintainer released in <pkg>/review/maintainer-release.json
 * are taken; the package's own review fields are left as they are. Writes
 *
 *   src/mock/bodies/museum/<slug>.md  the article text, unchanged except that
 *                                     \( … \) / \[ … \] math becomes $ … $ / $$ … $$,
 *                                     the delimiters the renderer reads;
 *   src/mock/museum.ts                titles, summaries, filing and sources (generated).
 *
 * An entry that already existed keeps its earlier bodies in src/mock/bodies/<slug>.md
 * untouched; the rewrite is read from museum/ from its new revision on (src/mock/entries.ts).
 * Sources are set by hand in tools/museum-sources.mjs; one cited by several
 * articles (same URL) becomes one source. Re-running rewrites both outputs.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { SOURCES } from "./museum-sources.mjs";

const PKG = process.argv[2] ?? "handoff/museum-upgrade";
const BODIES = "src/mock/bodies/museum";
const DATA = "src/mock/museum.ts";

const json = (path) => JSON.parse(readFileSync(join(PKG, path), "utf8").replace(/^﻿/, ""));
const fail = (message) => {
  console.error(`import-museum-articles: ${message}`);
  process.exit(1);
};

const taxonomy = json("taxonomy-map.json");
const release = json("review/maintainer-release.json");
const released = new Set(release.articles);
const articles = taxonomy.articles.filter((a) => released.has(a.slug));
const held = taxonomy.articles.filter((a) => !released.has(a.slug)).map((a) => a.slug);
const slugs = new Set(taxonomy.articles.map((a) => a.slug));

/** The renderer (remark-math) reads $…$ and $$…$$ only. */
const normaliseMath = (text) =>
  text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => `$$${tex}$$`).replace(/\\\((.+?)\\\)/g, (_m, tex) => `$${tex}$`);

/** Plain prose for a card: no Markdown emphasis or links. */
const plain = (text) =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|__/g, "")
    .replace(/(^|[^\w*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The card summary: the package's opening sentences, minus the sentence that
 * states the curatorial pairing — the card already carries the specimen label.
 */
const PAIRING = /策展|对应物|taxonomy-map|counterpart|catalogue pairing|curatorial/i;
function summary(text, lang) {
  const sentences =
    lang === "zh"
      ? (plain(text).match(/[^。！？]+[。！？]?/g) ?? [])
      : plain(text).split(/(?<=[.!?]["”’)]?)\s+(?=["“]?[A-Z])/);
  const kept = sentences
    .filter((s) => !PAIRING.test(s))
    .join(lang === "zh" ? "" : " ")
    .trim();
  return kept || plain(text);
}

function body(article) {
  const text = normaliseMath(
    readFileSync(join(PKG, article.bodyPath), "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n"),
  );
  for (const lang of ["zh", "en"]) {
    if (!new RegExp(`^:::${lang}\\s*$`, "m").test(text)) fail(`${article.slug}: no :::${lang} block`);
  }
  if (/\\\(|\\\[/.test(text)) fail(`${article.slug}: math delimiters left after normalising`);
  for (const [, slug] of text.matchAll(/\]\(\/entries\/([\w-]+)\)/g)) {
    if (!slugs.has(slug)) fail(`${article.slug}: links to unknown entry /entries/${slug}`);
  }
  return `${text.trim()}\n`;
}

/** Resolve a hand-set source, following "=slug/id" to the first citation of the same work. */
function setSource(key) {
  let row = SOURCES[key];
  for (let hops = 0; typeof row === "string" && hops < 4; hops++) row = SOURCES[row.slice(1)];
  if (!Array.isArray(row)) fail(`source ${key} is not set in tools/museum-sources.mjs`);
  const [kind, creators, title, publisher, year, locator] = row;
  return { kind, creators, title, publisher, year, locator };
}

const sources = new Map(); // url → Source
const sourceIdsOf = (article, metadata) =>
  metadata.sources.map((record) => {
    const url = record.url ?? record.canonicalUrl;
    if (!url) fail(`${article.slug}/${record.id}: source has no URL`);
    const known = sources.get(url);
    if (known) return known.id;
    const set = setSource(`${article.slug}/${record.id}`);
    const source = {
      id: `museum-${article.slug}-${record.id}`.toLowerCase(),
      kind: set.kind,
      title: set.title,
      creators: set.creators,
      ...(set.year ? { year: set.year } : {}),
      ...(set.publisher ? { publisher: set.publisher } : {}),
      url,
      ...(set.locator ? { locator: set.locator } : {}),
    };
    sources.set(url, source);
    return source.id;
  });

let nextId = 17; // PW-0001 … PW-0016 are the entries written before the museum
const imported = articles.map((article) => {
  const metadata = json(article.metadataPath);
  if (metadata.title.zh !== article.title.zh || metadata.title.en !== article.title.en)
    fail(`${article.slug}: title differs between taxonomy-map and metadata`);
  for (const lang of ["zh", "en"]) if (!metadata.summary?.[lang]) fail(`${article.slug}: no ${lang} summary`);
  return {
    id: article.legacyEntryId ?? `PW-${String(nextId++).padStart(4, "0")}`,
    slug: article.slug,
    ...(article.legacyEntryId ? { legacy: true } : {}),
    title: article.title,
    summary: { zh: summary(metadata.summary.zh, "zh"), en: summary(metadata.summary.en, "en") },
    filing: {
      categoryId: article.primaryCategoryId,
      auxiliaryCategoryIds: article.auxiliaryCategoryIds,
      species: article.species,
      level: article.level,
      contentRole: article.role,
    },
    sourceIds: sourceIdsOf(article, metadata),
    body: body(article),
  };
});

// ── Taxon snapshots: the names as verified, frozen for the site to read ──────
// Catalogue of Life COL26.9 first (links pinned to that release in ChecklistBank);
// a species COL does not index is taken from its specialist database (AlgaeBase,
// published through WoRMS). GBIF and NCBI are the cross-checks.
const audit = json("review/taxonomy-final-audit.json");
const COL_RELEASE = "COL26.9";
const colLink = (dataset, id) => `https://www.checklistbank.org/dataset/${dataset}/taxon/${encodeURIComponent(id)}`;
const day = (stamp) => String(stamp).slice(0, 10);
const verifiedAt = audit.generatedAt;

function colSource(col) {
  if (col?.status !== "accepted" || !col.usageId) return null;
  return {
    catalogue: "col",
    release: COL_RELEASE,
    id: col.usageId,
    url: colLink(col.datasetKey, col.usageId),
    accessedAt: day(col.accessDate),
  };
}
const higher = (rank, rows) =>
  rows.map((row) => {
    const col = colSource(row.col26_9);
    if (!col) fail(`${rank} ${row.scientificName}: no accepted COL26.9 usage`);
    return {
      scientificName: row.scientificName,
      rank,
      acceptedName: row.scientificName,
      authority: row.col26_9.authorship ?? "",
      synonyms: [],
      sources: [col],
      verifiedAt,
    };
  });

const speciesSnapshots = audit.species
  .filter((row) => released.has(row.slug))
  .map((row) => {
    const usage = row.species.col26_9Usage;
    const p = row.providers;
    const supplement = p.specialistSupplement;
    if (!usage && supplement?.status !== "accepted")
      fail(`${row.slug}: species has neither a COL usage nor an accepted specialist record`);
    const primary = usage
      ? {
          acceptedName: usage.scientificNameAsStored,
          authority: usage.authorship,
          source: {
            catalogue: "col",
            release: COL_RELEASE,
            id: usage.acceptedUsageId,
            url: colLink(usage.datasetKey, usage.acceptedUsageId),
            accessedAt: day(p.catalogueOfLifeCOL26_9.accessDate),
          },
        }
      : {
          acceptedName: supplement.validName,
          authority: supplement.authority,
          source: {
            catalogue: "algaebase",
            id: String(supplement.aphiaId),
            url: supplement.recordUrl,
            accessedAt: day(supplement.snapshotRetrievedAt),
          },
        };
    const sources = [primary.source];
    if (p.gbif?.status === "ACCEPTED")
      sources.push({
        catalogue: "gbif",
        id: String(p.gbif.usageKey),
        url: `https://www.gbif.org/species/${p.gbif.usageKey}`,
        accessedAt: day(p.gbif.snapshotRetrievedAt),
      });
    if (p.ncbiTaxonomy?.taxId)
      sources.push({
        catalogue: "ncbi",
        id: String(p.ncbiTaxonomy.taxId),
        url: `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${p.ncbiTaxonomy.taxId}`,
        accessedAt: day(verifiedAt),
      });
    return {
      scientificName: row.species.taxonomyMapScientificName,
      rank: "species",
      acceptedName: primary.acceptedName,
      authority: primary.authority ?? "",
      synonyms: [],
      sources,
      verifiedAt,
    };
  });
const snapshots = [...higher("family", audit.families), ...higher("genus", audit.genera), ...speciesSnapshots];
for (const a of imported) {
  if (!snapshots.some((s) => s.rank === "species" && s.scientificName === a.filing.species))
    fail(`${a.slug}: no snapshot for ${a.filing.species}`);
}

// ── Write ───────────────────────────────────────────────────────────────────
mkdirSync(BODIES, { recursive: true });
for (const file of readdirSync(BODIES)) rmSync(join(BODIES, file));
for (const a of imported) writeFileSync(join(BODIES, `${a.slug}.md`), a.body);

const data = `/**
 * The museum articles: 53 species, one per entry, written for the family → genus
 * catalogue. GENERATED by tools/import-museum-articles.mjs from the curation
 * package — do not edit by hand; change the package (or tools/museum-sources.mjs)
 * and re-run the tool. Bodies are in ./bodies/museum/<slug>.md.
 */
import type { EntryTaxonomy, Localized, Source, TaxonSnapshot } from "@/lib/model/types";

export interface MuseumArticle {
  id: string;
  slug: string;
  /** Rewrites an entry written before the museum (it keeps its earlier revisions). */
  legacy?: true;
  title: Localized;
  summary: Localized;
  filing: EntryTaxonomy;
  sourceIds: string[];
}

/** When the maintainer released the articles for publication. */
export const MUSEUM_RELEASED_AT = "${release.releasedOn}T12:00:00+08:00";

export const museumArticles: MuseumArticle[] = ${JSON.stringify(
  imported.map((a) => ({ ...a, body: undefined })),
  null,
  2,
)};

export const museumSources: Source[] = ${JSON.stringify([...sources.values()], null, 2)};

/** The 7 families, 45 genera and 53 species as verified (${COL_RELEASE}; AlgaeBase via WoRMS where COL has no species record). */
export const museumSnapshots: TaxonSnapshot[] = ${JSON.stringify(snapshots, null, 2)};
`;
const options = (await prettier.resolveConfig(DATA)) ?? {};
writeFileSync(DATA, await prettier.format(data, { ...options, filepath: DATA }));

console.log(
  `imported ${imported.length} articles (${imported.filter((a) => a.legacy).length} rewrites, ${imported.filter((a) => !a.legacy).length} new), ${sources.size} sources, ${snapshots.length} taxon snapshots` +
    (held.length ? `; held back (not released): ${held.join(", ")}` : ""),
);
