import type { ChronicleRepository } from "@/lib/services/contracts";
import type { Chronicle, ChronicleDetail } from "@/lib/model/types";
import { facetsOf, matchesChronicle, newestFirst } from "@/lib/chronicles/query";
import { chronicles } from "@/mock/chronicles";

/*
 * In-memory annals store: read-only fixtures, newest first. Like the friend
 * links, the records live in the fixtures until a CMS writes them; the mock
 * keeps one deep copy and hands out copies, so a caller can never reach into
 * `src/mock` or the store and mutate it. Every filter, the search included,
 * runs over the whole register before `offset` and `limit` cut a page; the
 * 200-record default matches the Supabase adapter's page size.
 */

export function createMockChronicleRepository(fixtures: ChronicleDetail[] = chronicles): ChronicleRepository {
  const records: ChronicleDetail[] = structuredClone(fixtures).sort(newestFirst);
  // The list carries no account: like the Supabase list, it never reads the bodies out.
  const summary = (record: ChronicleDetail): Chronicle => {
    const copy = structuredClone(record);
    delete copy.body;
    return copy;
  };

  return {
    async listChronicles(query) {
      const offset = query?.offset ?? 0;
      return records
        .filter((record) => matchesChronicle(record, query))
        .slice(offset, offset + (query?.limit ?? 200))
        .map(summary);
    },

    async countChronicles(query) {
      return records.filter((record) => matchesChronicle(record, query)).length;
    },

    async chronicleFacets() {
      return facetsOf(records);
    },

    async adjacentChronicles(id) {
      const at = records.findIndex((record) => record.id === id);
      if (at < 0) return { older: null, newer: null };
      const older = records[at + 1];
      const newer = records[at - 1];
      return { older: older ? summary(older) : null, newer: newer ? summary(newer) : null };
    },

    async getChronicle(id) {
      const found = records.find((record) => record.id === id);
      return found ? structuredClone(found) : null;
    },
  };
}
