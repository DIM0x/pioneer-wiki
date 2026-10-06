import type { EntryMetadata, EntrySummary, EntryTaxonomy, Lang, Localized, Revision } from "@/lib/model/types";
import { CONTENT_ROLE_IDS, LEVEL_IDS } from "@/lib/model/vocab";
import { genusForLegacyDomain } from "@/lib/taxonomy/legacy";
import { diffLines } from "diff";
import { entries, relations, type EntryFixture } from "@/mock/entries";
import {
  ServiceError,
  type DraftInput,
  type EntryQuery,
  type EntryRepository,
  type ReviewTransitionInput,
} from "@/lib/services/contracts";
import { bodyAt } from "./body";
import type { TaxonomyStore } from "./taxonomy";

const working = entries.map((entry) => ({ ...entry, revisions: entry.revisions.map((revision) => ({ ...revision })) }));
const bodies = new Map<string, string>();
for (const entry of working) bodies.set(`${entry.id}@r${entry.revision}`, bodyAt(entry.slug, entry.revision));
/**
 * The catalogue place each revision carries. The entry's own taxonomy fields are
 * the published place; a draft that refiles it only changes this map until it is
 * published.
 */
const filedAt = new Map<string, EntryTaxonomy>();
const taxonomyOf = (entry: EntryFixture): EntryTaxonomy => ({
  categoryId: entry.categoryId,
  auxiliaryCategoryIds: [...entry.auxiliaryCategoryIds],
  species: entry.species,
  level: entry.level,
  contentRole: entry.contentRole,
});
for (const entry of working)
  for (const r of entry.revisions) filedAt.set(`${entry.id}@r${r.number}`, taxonomyOf(entry));
const summaryOf = (entry: EntryFixture): EntrySummary => {
  const { revisions, ...summary } = entry;
  void revisions;
  return { ...summary, auxiliaryCategoryIds: [...summary.auxiliaryCategoryIds] };
};
const statsOf = (before: string, after: string) =>
  diffLines(before, after).reduce(
    (stats, part) => {
      const lines = part.value.split("\n").length - Number(part.value.endsWith("\n"));
      if (part.added) stats.added += lines;
      if (part.removed) stats.removed += lines;
      return stats;
    },
    { added: 0, removed: 0 },
  );
const revisionsOf = (entry: EntryFixture): Revision[] =>
  entry.revisions
    .map((r, i) => ({
      id: `${entry.id}@r${r.number}`,
      entryId: entry.id,
      number: r.number,
      parentId: i ? `${entry.id}@r${entry.revisions[i - 1].number}` : undefined,
      authorId: r.authorId,
      createdAt: r.createdAt,
      note: r.note,
      state: r.state,
      taxonomy: filedAt.get(`${entry.id}@r${r.number}`),
      stats: statsOf(
        i
          ? (bodies.get(`${entry.id}@r${entry.revisions[i - 1].number}`) ??
              bodyAt(entry.slug, entry.revisions[i - 1].number))
          : "",
        bodies.get(`${entry.id}@r${r.number}`) ?? bodyAt(entry.slug, r.number),
      ),
    }))
    .reverse();

/* ── Creating a new entry from the editor ────────────────────────────────── */

const nextEntryId = () => {
  const max = working.reduce((m, e) => Math.max(m, Number(e.id.replace(/^PW-/, "")) || 0), 0);
  return `PW-${String(max + 1).padStart(4, "0")}`;
};

const slugFor = (title: Localized, id: string): string => {
  const base =
    title.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `new-${id.slice(3).toLowerCase()}`;
  let slug = base;
  for (let n = 2; working.some((x) => x.slug === slug); n++) slug = `${base}-${n}`;
  return slug;
};

const languagesOf = (body: string): Lang[] => {
  const langs: Lang[] = [];
  if (body.includes(":::zh")) langs.push("zh");
  if (body.includes(":::en")) langs.push("en");
  return langs.length ? langs : (["zh", "en"] as Lang[]);
};

const metadataOf = (input: DraftInput) =>
  input.metadata ?? {
    scale: "micro" as const,
    role: "observer" as const,
    contributorIds: [],
    sourceIds: [],
    tagIds: [],
    relationDrafts: [],
    pendingSources: [],
    pendingTags: [],
  };

/**
 * The place a revision files the entry at. `changes` (the draft's metadata) may
 * move it; anything it leaves out keeps the place of the revision it starts from.
 * Throws when the catalogue cannot hold the result — also when publishing a draft
 * whose genus was archived after it was saved.
 */
const filingOf = (
  taxonomy: TaxonomyStore,
  base: Partial<EntryTaxonomy> | undefined,
  changes: Partial<EntryMetadata> = {},
): EntryTaxonomy => {
  const m = changes;
  const categoryId = m.categoryId ?? base?.categoryId;
  const genus = taxonomy.categories.find((c) => c.id === categoryId);
  if (!genus || genus.status !== "active")
    throw new ServiceError("invalid", "An entry is filed under one active genus");
  const auxiliaryCategoryIds = [...new Set(m.auxiliaryCategoryIds ?? base?.auxiliaryCategoryIds ?? [])];
  for (const aux of auxiliaryCategoryIds) {
    if (aux === genus.id) throw new ServiceError("invalid", "The primary genus cannot also be a cross-genus reference");
    if (!taxonomy.categories.some((c) => c.id === aux && c.status === "active"))
      throw new ServiceError("invalid", `The cross-genus reference ${aux} is not an active genus`);
  }
  const species = (m.species ?? base?.species)?.trim() || undefined;
  if (species && !species.startsWith(`${genus.scientificName} `))
    throw new ServiceError("invalid", `The species ${species} is not in the genus ${genus.scientificName}`);
  const level = m.level ?? base?.level ?? "concept";
  const contentRole = m.contentRole ?? base?.contentRole ?? "foundation";
  if (!LEVEL_IDS.includes(level)) throw new ServiceError("invalid", "Unknown content level");
  if (!CONTENT_ROLE_IDS.includes(contentRole)) throw new ServiceError("invalid", "Unknown content role");
  return { categoryId: genus.id, auxiliaryCategoryIds, species, level, contentRole };
};

/** A new entry's starting genus: the one given, or for older clients the genus of the phylum they name. */
const startingGenus = (taxonomy: TaxonomyStore, input: DraftInput): Partial<EntryTaxonomy> => ({
  categoryId: input.categoryId ?? (input.domain ? genusForLegacyDomain(input.domain, taxonomy.categories) : undefined),
});

const createEntry = (taxonomy: TaxonomyStore, input: DraftInput): Revision => {
  const filed = filingOf(taxonomy, startingGenus(taxonomy, input), input.metadata);
  const now = new Date().toISOString();
  const id = nextEntryId();
  filedAt.set(`${id}@r1`, filed);
  working.push({
    id,
    slug: slugFor(input.title, id),
    title: input.title,
    summary: input.summary,
    ...filed,
    domain: input.domain,
    scale: metadataOf(input).scale,
    role: metadataOf(input).role,
    analogue: metadataOf(input).analogue,
    status: "draft",
    authorId: input.authorId,
    contributorIds: metadataOf(input).contributorIds,
    sourceIds: metadataOf(input).sourceIds,
    tagIds: metadataOf(input).tagIds,
    heroAssetId: metadataOf(input).heroAssetId,
    bodyLanguages: languagesOf(input.body),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    revisions: [{ number: 1, authorId: input.authorId, createdAt: now, state: "draft", note: input.note }],
  });
  bodies.set(`${id}@r1`, input.body);
  return {
    id: `${id}@r1`,
    entryId: id,
    number: 1,
    authorId: input.authorId,
    createdAt: now,
    note: input.note,
    state: "draft",
    taxonomy: filed,
    stats: statsOf("", input.body),
  };
};

export function createMockEntryRepository(taxonomy: TaxonomyStore): EntryRepository {
  const familyOf = (categoryId: string) => taxonomy.categories.find((c) => c.id === categoryId)?.familyId;
  return {
    async listEntries(q: EntryQuery = {}) {
      return working
        .filter((e) => !q.status || q.status.includes(e.status))
        .filter((e) => !q.categoryId || q.categoryId.includes(e.categoryId))
        .filter((e) => !q.familyId || q.familyId.includes(familyOf(e.categoryId) ?? ""))
        .filter((e) => !q.auxiliaryCategoryId || e.auxiliaryCategoryIds.some((c) => q.auxiliaryCategoryId?.includes(c)))
        .filter((e) => !q.domain || (e.domain !== undefined && q.domain.includes(e.domain)))
        .filter((e) => !q.scale || q.scale.includes(e.scale))
        .filter((e) => q.featured === undefined || Boolean(e.featured) === q.featured)
        .sort((a, b) =>
          (q.sort === "created" ? b.createdAt : b.updatedAt).localeCompare(
            q.sort === "created" ? a.createdAt : a.updatedAt,
          ),
        )
        .slice(0, q.limit ?? Number.MAX_SAFE_INTEGER)
        .map(summaryOf);
    },
    async getEntry(slug) {
      const e = working.find((x) => x.slug === slug);
      return e ? { ...summaryOf(e), body: bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision) } : null;
    },
    async getEntryById(id) {
      const e = working.find((x) => x.id === id);
      return e ? { ...summaryOf(e), body: bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision) } : null;
    },
    async listRevisions(id) {
      const e = working.find((x) => x.id === id);
      return e ? revisionsOf(e) : [];
    },
    async getRevisionBody(id) {
      const [entryId, revision] = id.split("@r");
      const e = working.find((x) => x.id === entryId);
      return e ? (bodies.get(id) ?? bodyAt(e.slug, Number(revision))) : null;
    },
    async listRelations(entryId) {
      return entryId ? relations.filter((r) => r.from === entryId || r.to === entryId) : relations;
    },
    async saveDraft(input: DraftInput) {
      const e = input.entryId ? working.find((x) => x.id === input.entryId) : undefined;
      if (input.entryId && !e) throw new ServiceError("invalid", "Entry does not exist");
      if (!e) return createEntry(taxonomy, input);
      if (input.baseRevision !== undefined && input.baseRevision !== e.revision)
        throw new ServiceError("conflict", "The entry changed while you were editing it");
      const number = e.revisions.length + 1;
      const metadata = metadataOf(input);
      filedAt.set(`${e.id}@r${number}`, filingOf(taxonomy, filedAt.get(`${e.id}@r${e.revision}`), input.metadata));
      const revision = {
        number,
        authorId: input.authorId,
        createdAt: new Date().toISOString(),
        note: input.note,
        state: "draft" as const,
      };
      e.revisions.push(revision);
      e.status = "draft";
      e.updatedAt = revision.createdAt;
      e.revision = number;
      e.scale = metadata.scale;
      e.role = metadata.role;
      e.analogue = metadata.analogue;
      e.contributorIds = metadata.contributorIds;
      e.sourceIds = metadata.sourceIds;
      e.tagIds = metadata.tagIds;
      e.heroAssetId = metadata.heroAssetId;
      bodies.set(`${e.id}@r${number}`, input.body);
      return {
        id: `${e.id}@r${number}`,
        entryId: e.id,
        number,
        parentId: `${e.id}@r${number - 1}`,
        authorId: revision.authorId,
        createdAt: revision.createdAt,
        note: revision.note,
        state: revision.state,
        taxonomy: filedAt.get(`${e.id}@r${number}`),
        stats: statsOf(bodies.get(`${e.id}@r${number - 1}`) ?? bodyAt(e.slug, number - 1), input.body),
      };
    },
    async transition(input: ReviewTransitionInput) {
      const e = working.find((x) => x.id === input.entryId);
      if (!e) throw new ServiceError("invalid", "Entry does not exist");
      const allowed =
        (input.action === "submit" && e.status === "draft") ||
        (input.action === "publish" && e.status === "in_review") ||
        (input.action === "rollback" && Boolean(input.targetRevisionId));
      if (!allowed) throw new ServiceError("conflict", `Cannot ${input.action} from ${e.status}`);
      const state = input.action === "submit" ? "in_review" : ("published" as const);
      const sourceId =
        input.action === "rollback" && input.targetRevisionId ? input.targetRevisionId : `${e.id}@r${e.revision}`;
      // Re-check the stored place: its genus may have been archived since the draft was saved.
      const stored = filedAt.get(sourceId);
      const filed = stored ? filingOf(taxonomy, stored) : undefined;
      const number = e.revisions.length + 1;
      const createdAt = new Date().toISOString();
      e.revisions.push({ number, authorId: input.actorId, createdAt, note: input.note ?? input.action, state });
      const sourceBody =
        input.action === "rollback" && input.targetRevisionId
          ? bodies.get(input.targetRevisionId)
          : (bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision));
      bodies.set(`${e.id}@r${number}`, sourceBody ?? "");
      if (filed) {
        filedAt.set(`${e.id}@r${number}`, filed);
        if (state === "published") Object.assign(e, filed, { auxiliaryCategoryIds: [...filed.auxiliaryCategoryIds] });
      }
      e.status = state;
      e.updatedAt = createdAt;
      e.revision = number;
      return {
        id: `${e.id}@r${number}`,
        entryId: e.id,
        number,
        parentId: `${e.id}@r${number - 1}`,
        authorId: input.actorId,
        createdAt,
        note: input.note ?? input.action,
        state,
        taxonomy: filed,
        stats: statsOf(bodies.get(`${e.id}@r${number - 1}`) ?? bodyAt(e.slug, number - 1), sourceBody ?? ""),
      };
    },
  };
}
