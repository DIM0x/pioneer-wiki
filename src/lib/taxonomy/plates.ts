import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Localized } from "@/lib/model/types";

/**
 * A plate of the catalogue that has passed review: a family's environment, a
 * genus's habitat and forms, or one species. tools/prepare-catalogue-plates.mjs
 * writes them — cut to transparency so they print straight onto the page —
 * together with public/catalogue/plates.json. A plate that is missing there is
 * still being drawn or reviewed, and its place shows the plate in preparation.
 */
export interface CataloguePlate {
  id: string;
  rank: "family" | "genus" | "species";
  /** Family id, genus id or entry slug. */
  ownerId: string;
  src: string;
  width: number;
  height: number;
  alt: Localized;
  caption?: Localized;
  credit: string;
  license: string;
}

function approved(): CataloguePlate[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public", "catalogue", "plates.json"), "utf8"),
    ) as CataloguePlate[];
  } catch {
    return [];
  }
}

export function cataloguePlate(rank: CataloguePlate["rank"], ownerId: string): CataloguePlate | null {
  return approved().find((p) => p.rank === rank && p.ownerId === ownerId) ?? null;
}
