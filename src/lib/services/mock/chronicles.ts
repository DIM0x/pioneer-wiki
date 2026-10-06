import type { ChronicleRepository } from "@/lib/services/contracts";
import type { Chronicle, ChronicleDetail } from "@/lib/model/types";
import { chronicles } from "@/mock/chronicles";

/*
 * In-memory annals store: read-only fixtures, newest first. Like the friend
 * links, the records live in the fixtures until a CMS writes them; the mock
 * keeps one deep copy so a caller can never reach into `src/mock` and mutate it.
 * The 200-record default matches the Supabase adapter's page size, so both
 * sources answer an unbounded query with the same set.
 */

export function createMockChronicleRepository(): ChronicleRepository {
  const records: ChronicleDetail[] = structuredClone(chronicles);
  const newestFirst = (a: Chronicle, b: Chronicle) => b.date.localeCompare(a.date) || b.number - a.number;

  return {
    async listChronicles(query) {
      return records
        .filter((c) => !query?.kind?.length || query.kind.includes(c.kind))
        .filter((c) => !query?.year || c.date.startsWith(`${query.year}-`))
        .sort(newestFirst)
        .slice(0, query?.limit ?? 200);
    },

    async getChronicle(id) {
      const found = records.find((c) => c.id === id);
      return found ? structuredClone(found) : null;
    },
  };
}
