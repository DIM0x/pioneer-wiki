import type { EntrySummary, Revision } from "@/lib/model/types";
import { diffLines } from "diff";
import { entries, relations, type EntryFixture } from "@/mock/entries";
import { ServiceError, type DraftInput, type EntryQuery, type EntryRepository, type ReviewTransitionInput } from "@/lib/services/contracts";
import { bodyAt } from "./body";

const working = entries.map((entry) => ({ ...entry, revisions: entry.revisions.map((revision) => ({ ...revision })) }));
const bodies = new Map<string, string>();
for (const entry of working) bodies.set(`${entry.id}@r${entry.revision}`, bodyAt(entry.slug, entry.revision));
const summaryOf = (entry: EntryFixture): EntrySummary => {
  const { revisions, ...summary } = entry;
  void revisions;
  return summary;
};
const statsOf = (before: string, after: string) => diffLines(before, after).reduce((stats, part) => {
  const lines = part.value.split("\n").length - Number(part.value.endsWith("\n"));
  if (part.added) stats.added += lines;
  if (part.removed) stats.removed += lines;
  return stats;
}, { added: 0, removed: 0 });
const revisionsOf = (entry: EntryFixture): Revision[] => entry.revisions.map((r, i) => ({
  id: `${entry.id}@r${r.number}`, entryId: entry.id, number: r.number,
  parentId: i ? `${entry.id}@r${entry.revisions[i - 1].number}` : undefined,
  authorId: r.authorId, createdAt: r.createdAt, note: r.note, state: r.state,
  stats: statsOf(i ? bodies.get(`${entry.id}@r${entry.revisions[i - 1].number}`) ?? bodyAt(entry.slug, entry.revisions[i - 1].number) : "", bodies.get(`${entry.id}@r${r.number}`) ?? bodyAt(entry.slug, r.number)),
})).reverse();

export function createMockEntryRepository(): EntryRepository {
  return {
    async listEntries(q: EntryQuery = {}) {
      return working.filter((e) => !q.status || q.status.includes(e.status))
        .filter((e) => !q.domain || q.domain.includes(e.domain))
        .filter((e) => !q.scale || q.scale.includes(e.scale))
        .filter((e) => q.featured === undefined || Boolean(e.featured) === q.featured)
        .sort((a, b) => (q.sort === "created" ? b.createdAt : b.updatedAt).localeCompare(q.sort === "created" ? a.createdAt : a.updatedAt))
        .slice(0, q.limit ?? Number.MAX_SAFE_INTEGER).map(summaryOf);
    },
    async getEntry(slug) { const e = working.find((x) => x.slug === slug); return e ? { ...summaryOf(e), body: bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision) } : null; },
    async getEntryById(id) { const e = working.find((x) => x.id === id); return e ? { ...summaryOf(e), body: bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision) } : null; },
    async listRevisions(id) { const e = working.find((x) => x.id === id); return e ? revisionsOf(e) : []; },
    async getRevisionBody(id) { const [entryId, revision] = id.split("@r"); const e = working.find((x) => x.id === entryId); return e ? bodies.get(id) ?? bodyAt(e.slug, Number(revision)) : null; },
    async listRelations(entryId) { return entryId ? relations.filter((r) => r.from === entryId || r.to === entryId) : relations; },
    async saveDraft(input: DraftInput) {
      const e = input.entryId ? working.find((x) => x.id === input.entryId) : undefined;
      if (!e) throw new ServiceError("invalid", "Entry does not exist");
      const number = e.revisions.length + 1;
      const revision = { number, authorId: input.authorId, createdAt: new Date().toISOString(), note: input.note, state: "draft" as const };
      e.revisions.push(revision); e.status = "draft"; e.updatedAt = revision.createdAt; e.revision = number;
      bodies.set(`${e.id}@r${number}`, input.body);
      return { id: `${e.id}@r${number}`, entryId: e.id, number, parentId: `${e.id}@r${number - 1}`, authorId: revision.authorId, createdAt: revision.createdAt, note: revision.note, state: revision.state, stats: statsOf(bodies.get(`${e.id}@r${number - 1}`) ?? bodyAt(e.slug, number - 1), input.body) };
    },
    async transition(input: ReviewTransitionInput) {
      const e = working.find((x) => x.id === input.entryId);
      if (!e) throw new ServiceError("invalid", "Entry does not exist");
      const allowed = input.action === "submit" && e.status === "draft" || input.action === "publish" && e.status === "in_review" || input.action === "rollback" && Boolean(input.targetRevisionId);
      if (!allowed) throw new ServiceError("conflict", `Cannot ${input.action} from ${e.status}`);
      const state = input.action === "submit" ? "in_review" : "published" as const;
      const number = e.revisions.length + 1; const createdAt = new Date().toISOString();
      e.revisions.push({ number, authorId: input.actorId, createdAt, note: input.note ?? input.action, state });
      const sourceBody = input.action === "rollback" && input.targetRevisionId ? bodies.get(input.targetRevisionId) : bodies.get(`${e.id}@r${e.revision}`) ?? bodyAt(e.slug, e.revision);
      bodies.set(`${e.id}@r${number}`, sourceBody ?? "");
      e.status = state; e.updatedAt = createdAt; e.revision = number;
      return { id: `${e.id}@r${number}`, entryId: e.id, number, parentId: `${e.id}@r${number - 1}`, authorId: input.actorId, createdAt, note: input.note ?? input.action, state, stats: statsOf(bodies.get(`${e.id}@r${number - 1}`) ?? bodyAt(e.slug, number - 1), sourceBody ?? "") };
    },
  };
}
