import type { Category, EntrySummary, Family, Localized, Relation, ReviewState } from "@/lib/model/types";
import { toRoman } from "@/lib/roman";

/*
 * The tree of life (生命之树): the catalogue drawn as a radial systema.
 *
 *   root (centre) → seven family boughs → forty-five genus branches → species leaves
 *
 * Every genus owns at least one slot on the leaf ring, so the whole catalogue
 * keeps its shape even where nothing is published yet. Relations between
 * entries are routed through the tree — leaf, genus, family, (root), family,
 * genus, leaf — and drawn as bundled B-splines (Holten 2006), so related
 * species are joined through their common ancestor instead of across it.
 *
 * Pure and deterministic: no DOM, no randomness. Angles are degrees clockwise
 * from the top; `rotation` turns the whole tree.
 */

export const TREE = {
  centre: 560,
  radius: { family: 118, genus: 248, leaf: 360 },
  /** Empty slots left between two families, in leaf slots. */
  familyGap: 1.6,
  /** How tightly relation curves hug the tree (0 = straight chord, 1 = full route). */
  beta: 0.82,
} as const;

export interface TreeFamily {
  id: string;
  slug: string;
  numeral: string;
  name: Localized;
  scientificName: string;
  angle: number;
  /** Angular span covered by the family's slots. */
  start: number;
  end: number;
}

export interface TreeGenus {
  id: string;
  slug: string;
  familyId: string;
  name: Localized;
  scientificName: string;
  angle: number;
  /** No visible species yet: drawn as an empty case (待入藏). */
  empty: boolean;
}

export interface TreeLeaf {
  entryId: string;
  slug: string;
  title: Localized;
  species?: string;
  status: ReviewState;
  familyId: string;
  genusId: string;
  angle: number;
}

/** A route through the tree: [angle, radius] control points. */
export type Route = Array<[number, number]>;

export interface TreeEdge {
  id: string;
  kind: Relation["kind"];
  strength: Relation["strength"];
  from: string;
  to: string;
  note?: Localized;
  route: Route;
}

export interface TreeReference {
  id: string;
  entryId: string;
  genusId: string;
  route: Route;
}

export interface TreeLayout {
  families: TreeFamily[];
  genera: TreeGenus[];
  leaves: TreeLeaf[];
  edges: TreeEdge[];
  /** Cross-genus references: a species pointing at a genus that also concerns it. */
  references: TreeReference[];
}

export function buildTree(input: {
  families: Family[];
  categories: Category[];
  entries: EntrySummary[];
  relations: Relation[];
}): TreeLayout {
  const families = [...input.families].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const familyIds = new Set(families.map((f) => f.id));
  const generaOf = (familyId: string) =>
    input.categories
      .filter((c) => c.familyId === familyId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const genusIds = new Set(input.categories.filter((c) => familyIds.has(c.familyId)).map((c) => c.id));
  const speciesOf = (genusId: string) =>
    input.entries.filter((e) => e.categoryId === genusId).sort((a, b) => a.id.localeCompare(b.id));

  // Slots: one per species, at least one per genus, with a gap after each family.
  type Slot = { familyId: string; genusId: string; entry?: EntrySummary; at: number };
  const slots: Slot[] = [];
  let at = 0;
  for (const f of families) {
    for (const g of generaOf(f.id)) {
      const species = speciesOf(g.id);
      if (!species.length) slots.push({ familyId: f.id, genusId: g.id, at: at++ });
      for (const e of species) slots.push({ familyId: f.id, genusId: g.id, entry: e, at: at++ });
    }
    at += TREE.familyGap;
  }
  const total = at;
  // Centre the first family's gap at the top, so the ring reads from just past twelve o'clock.
  const angleOf = (position: number) => ((position + 0.5 + TREE.familyGap / 2) / total) * 360;

  const genera: TreeGenus[] = input.categories
    .filter((c) => genusIds.has(c.id))
    .map((c) => {
      const own = slots.filter((s) => s.genusId === c.id);
      return {
        id: c.id,
        slug: c.slug,
        familyId: c.familyId,
        name: c.name,
        scientificName: c.scientificName,
        angle: mean(own.map((s) => angleOf(s.at))),
        empty: !own.some((s) => s.entry),
      };
    });

  const treeFamilies: TreeFamily[] = families.map((f, i) => {
    const own = slots.filter((s) => s.familyId === f.id).map((s) => angleOf(s.at));
    const start = Math.min(...own);
    const end = Math.max(...own);
    return {
      id: f.id,
      slug: f.slug,
      numeral: toRoman(i + 1),
      name: f.name,
      scientificName: f.scientificName,
      angle: (start + end) / 2,
      start,
      end,
    };
  });

  const leaves: TreeLeaf[] = slots
    .filter((s): s is Slot & { entry: EntrySummary } => Boolean(s.entry))
    .map((s) => ({
      entryId: s.entry.id,
      slug: s.entry.slug,
      title: s.entry.title,
      species: s.entry.species,
      status: s.entry.status,
      familyId: s.familyId,
      genusId: s.genusId,
      angle: angleOf(s.at),
    }));

  const layout: TreeLayout = { families: treeFamilies, genera, leaves, edges: [], references: [] };
  const leafOf = new Map(leaves.map((l) => [l.entryId, l]));

  layout.edges = input.relations.flatMap((r) => {
    const a = leafOf.get(r.from);
    const b = leafOf.get(r.to);
    if (!a || !b || a === b) return [];
    return [
      {
        id: r.id,
        kind: r.kind,
        strength: r.strength,
        from: r.from,
        to: r.to,
        note: r.note,
        route: routeBetween(layout, a, b),
      },
    ];
  });

  layout.references = leaves.flatMap((leaf) => {
    const entry = input.entries.find((e) => e.id === leaf.entryId);
    return (entry?.auxiliaryCategoryIds ?? [])
      .filter((g) => genusIds.has(g) && g !== leaf.genusId)
      .map((genusId) => ({
        id: `${leaf.entryId}~${genusId}`,
        entryId: leaf.entryId,
        genusId,
        route: routeToGenus(layout, leaf, genusId),
      }));
  });

  return layout;
}

/** Leaf → genus → family → (root) → family → genus → leaf, through the lowest common ancestor. */
export function routeBetween(layout: TreeLayout, a: TreeLeaf, b: TreeLeaf): Route {
  const R = TREE.radius;
  const inner = R.leaf - 10;
  const genus = (id: string) => layout.genera.find((g) => g.id === id)!;
  const family = (id: string) => layout.families.find((f) => f.id === id)!;
  const start: Route = [[a.angle, inner]];
  const end: Route = [[b.angle, inner]];
  if (a.genusId === b.genusId) return [...start, [genus(a.genusId).angle, R.genus], ...end];
  const up: Route = [[genus(a.genusId).angle, R.genus]];
  const down: Route = [[genus(b.genusId).angle, R.genus]];
  if (a.familyId === b.familyId) return [...start, ...up, [family(a.familyId).angle, R.family], ...down, ...end];
  return [
    ...start,
    ...up,
    [family(a.familyId).angle, R.family],
    [0, 0],
    [family(b.familyId).angle, R.family],
    ...down,
    ...end,
  ];
}

/** Leaf → … → the genus node of a cross-genus reference. */
export function routeToGenus(layout: TreeLayout, leaf: TreeLeaf, genusId: string): Route {
  const R = TREE.radius;
  const target = layout.genera.find((g) => g.id === genusId)!;
  const own = layout.genera.find((g) => g.id === leaf.genusId)!;
  const famA = layout.families.find((f) => f.id === leaf.familyId)!;
  const famB = layout.families.find((f) => f.id === target.familyId)!;
  const start: Route = [
    [leaf.angle, R.leaf - 10],
    [own.angle, R.genus],
  ];
  if (famA.id === famB.id) return [...start, [famA.angle, R.family], [target.angle, R.genus]];
  return [...start, [famA.angle, R.family], [0, 0], [famB.angle, R.family], [target.angle, R.genus]];
}

// ── Geometry ────────────────────────────────────────────────────────────────

/** Cartesian point of [angle, radius] in the tree's viewBox, turned by `rotation`. */
export function polar(angle: number, radius: number, rotation = 0): [number, number] {
  const a = ((angle + rotation - 90) * Math.PI) / 180;
  return [TREE.centre + radius * Math.cos(a), TREE.centre + radius * Math.sin(a)];
}

const f = (n: number) => Math.round(n * 100) / 100;

/** A curved radial link from parent to child, as drawn in a dendrogram. */
export function branchPath(from: [number, number], to: [number, number], rotation = 0): string {
  const [a0, r0] = from;
  const [a1, r1] = to;
  const mid = (r0 + r1) / 2;
  const p0 = polar(a0, r0, rotation);
  const c0 = polar(a0, mid, rotation);
  const c1 = polar(a1, mid, rotation);
  const p1 = polar(a1, r1, rotation);
  return `M${f(p0[0])} ${f(p0[1])}C${f(c0[0])} ${f(c0[1])} ${f(c1[0])} ${f(c1[1])} ${f(p1[0])} ${f(p1[1])}`;
}

/**
 * A route straightened by `beta` and drawn as a uniform cubic B-spline, the
 * hierarchical edge-bundling curve. Matches d3's curveBundle + curveBasis.
 */
export function bundlePath(route: Route, rotation = 0, beta: number = TREE.beta): string {
  const pts = route.map(([a, r]) => polar(a, r, rotation));
  const n = pts.length - 1;
  const [x0, y0] = pts[0];
  const [xn, yn] = pts[n];
  const p = pts.map(([x, y], i) => {
    const t = n ? i / n : 0;
    return [beta * x + (1 - beta) * (x0 + t * (xn - x0)), beta * y + (1 - beta) * (y0 + t * (yn - y0))] as [
      number,
      number,
    ];
  });
  if (p.length < 3) return `M${f(p[0][0])} ${f(p[0][1])}L${f(p[n][0])} ${f(p[n][1])}`;
  let d = `M${f(p[0][0])} ${f(p[0][1])}L${f((5 * p[0][0] + p[1][0]) / 6)} ${f((5 * p[0][1] + p[1][1]) / 6)}`;
  const bezier = (a: [number, number], b: [number, number], c: [number, number]) =>
    `C${f((2 * a[0] + b[0]) / 3)} ${f((2 * a[1] + b[1]) / 3)} ${f((a[0] + 2 * b[0]) / 3)} ${f((a[1] + 2 * b[1]) / 3)} ${f((a[0] + 4 * b[0] + c[0]) / 6)} ${f((a[1] + 4 * b[1] + c[1]) / 6)}`;
  for (let i = 2; i < p.length; i++) d += bezier(p[i - 2], p[i - 1], p[i]);
  d += bezier(p[n - 1], p[n], p[n]);
  d += `L${f(p[n][0])} ${f(p[n][1])}`;
  return d;
}

export function normalise(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}
