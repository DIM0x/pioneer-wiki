import type { FriendLink, Lang } from "@/lib/model/types";
import { emWidth } from "@/lib/taxonomy/labels";
import realmData from "./realm.json";
import {
  cellAt,
  centreOf,
  contours,
  distanceTo,
  gridOver,
  grow,
  noise,
  rasterize,
  smooth,
  thin,
  type Grid,
  type Point,
} from "./field";

export type { Point } from "./field";

/*
 * 友邻疆域图 — the chart printed on the Links part.
 *
 * One land, traced from a real coast (tools/prepare-chart-realm.mjs), is
 * divided into territories as a 19th-century political map is: Pioneer Wiki
 * holds the capital and its home province, and every friend site holds a
 * territory of its own. The sheet never grows. Territories are grown over the
 * land from a fixed sequence of seats:
 *
 * - The first BASE seats are spread evenly over the land and opened in order
 *   of their distance from the capital, so the charted realm spreads outward
 *   and the land not yet charted stays blank — terra incognita. A new link
 *   claims the next blank territory.
 * - Once no blank land is left, every further link adds a seat at the point
 *   farthest from all others, which splits the largest territory.
 *
 * Seats never move, so a friend's territory only ever gives up a little
 * ground to a new neighbour. Everything here is computed in map units without
 * touching the DOM and memoised, so the server prints the chart and tests can
 * check it. Two sheets are cut from the same land: "wide", north up, and
 * "tall" (small screens), turned a quarter to the right.
 */

export type ChartShape = "wide" | "tall";

/** Seats laid out before any territory is split: the capital and the territories friends claim first. */
export const BASE = 14;
/** Width of the land on the sheet, in map units. */
const REALM_WIDTH = 1180;
/** Water lines: distance from the coast, inner to outer, and the spacing of points kept on each. */
const WATER = [
  { offset: 3, step: 2.4 },
  { offset: 7, step: 3.2 },
  { offset: 12, step: 4 },
  { offset: 18, step: 5 },
  { offset: 26, step: 6 },
];

/** Hand-colouring washes, laid as a band inside each charted territory's borders. */
export const WASHES = ["#c98276", "#5f9a86", "#d1a94c", "#5b80a6", "#9a7fa6", "#8a9d55", "#c08a4e", "#b5707f"];
/** The home province is coloured in the site's brick. */
export const HOME_WASH = "#b96a59";

/** Sheet sizes, type sizes and glyph scale (the tall sheet prints at about half the size of the wide one). */
export const SHEETS = {
  wide: {
    size: [1640, 1000] as Point,
    centre: [900, 500] as Point,
    glyph: 1,
    type: { nameMax: 22, nameMin: 12.5, alt: 12, number: 15, home: 26, title: 38, sea: 24, sounding: 10.5, grid: 12 },
  },
  tall: {
    size: [1000, 1640] as Point,
    centre: [500, 900] as Point,
    glyph: 1.5,
    type: { nameMax: 38, nameMin: 24, alt: 21, number: 30, home: 44, title: 62, sea: 40, sounding: 19, grid: 24 },
  },
} as const;

/** Map units are rounded so the server and the browser print the same digits. */
const r1 = (n: number) => Math.round(n * 10) / 10;
export const pt = ([x, y]: Point) => `${r1(x)},${r1(y)}`;
/** A polyline as path data, to one decimal or (`digits` 0) whole units. */
const pathOf = (line: Point[], digits = 1) => {
  const closed = line.length > 2 && line[0][0] === line.at(-1)![0] && line[0][1] === line.at(-1)![1];
  const at = digits ? pt : ([x, y]: Point) => `${Math.round(x)},${Math.round(y)}`;
  return `M${(closed ? line.slice(0, -1) : line).map(at).join(" ")}${closed ? "Z" : ""}`;
};

/** A small seeded generator (mulberry32 over an FNV-1a hash of the seed). */
export function random(seed: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── The land (static, computed once) ──────────────────────────────────────

export interface Realm {
  rings: Point[][];
  /** Bounding box of the land: x0, y0, x1, y1. */
  box: [number, number, number, number];
  capital: Point;
  /** res 1: distance from each cell to the land (0 on land). */
  fine: Grid;
  sea: Float32Array;
  /** res 2: land mask and distance inland from the sea. */
  coarse: Grid;
  land: Uint8Array;
  inland: Float32Array;
  coast: string;
  water: string[];
  rivers: string[];
  river: Uint8Array;
  sand: string;
  /** Candidate hills (base point, scale, which prototype) and trees, best first; each sheet keeps those that fit. */
  hills: Array<{ at: Point; scale: number; variant: number }>;
  trees: Point[];
}

/** Hill prototypes, drawn 20 units wide: height as a share of the width, and how far the peak leans. */
export const HILLS: Array<{ h: number; lean: number }> = [
  { h: 0.55, lean: -0.1 },
  { h: 0.64, lean: 0.08 },
  { h: 0.72, lean: -0.04 },
  { h: 0.8, lean: 0.12 },
  { h: 0.5, lean: 0.02 },
  { h: 0.68, lean: -0.14 },
  { h: 0.76, lean: 0.05 },
  { h: 0.6, lean: 0.15 },
];
export const HILL_WIDTH = 20;

let realmMemo: Realm | null = null;

export function realm(): Realm {
  if (realmMemo) return realmMemo;
  const src = realmData as { rings: number[][][]; capital: number[] };
  const xs = src.rings[0].map((p) => p[0]);
  const k = REALM_WIDTH / (Math.max(...xs) - Math.min(...xs));
  const rings = src.rings.map((r) => r.map(([x, y]) => [x * k, y * k] as Point));
  const all = rings.flat();
  const box: Realm["box"] = [
    Math.min(...all.map((p) => p[0])),
    Math.min(...all.map((p) => p[1])),
    Math.max(...all.map((p) => p[0])),
    Math.max(...all.map((p) => p[1])),
  ];
  const capital: Point = [src.capital[0] * k, src.capital[1] * k];
  const pad = 46;

  // Water lines: contours of the distance from the land.
  const fine = gridOver(box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad, 1);
  const sea = distanceTo(fine, rasterize(fine, rings));
  const water = WATER.map(({ offset, step }, ring) =>
    contours(fine, sea, offset)
      .filter((l) => l.length > 8 + ring * 6)
      .map((l) => pathOf(thin(smooth(l, 2), step), ring > 1 ? 0 : 1))
      .join(""),
  );

  const coarse = gridOver(box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad, 2);
  const land = rasterize(coarse, rings);
  const seaMask = land.map((v) => 1 - v);
  const inland = distanceTo(coarse, seaMask);
  const rand = random("pioneer-chart:realm");

  // Rivers run from the high interior down the slope of the land to the sea,
  // swinging from side to side as they go (never more than 70° off the
  // fall line, so they always reach the sea), and join where they meet.
  const inlandAt = ([x, y]: Point) => {
    const fx = (x - coarse.x0) / coarse.res - 0.5;
    const fy = (y - coarse.y0) / coarse.res - 0.5;
    const i = Math.max(0, Math.min(coarse.w - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(coarse.h - 2, Math.floor(fy)));
    const u = Math.min(1, Math.max(0, fx - i));
    const v = Math.min(1, Math.max(0, fy - j));
    const at = (a: number, b: number) => inland[(j + b) * coarse.w + i + a];
    return (at(0, 0) * (1 - u) + at(1, 0) * u) * (1 - v) + (at(0, 1) * (1 - u) + at(1, 1) * u) * v;
  };
  const sway = noise(rand, 46);
  const river = new Uint8Array(land.length);
  const rivers: string[] = [];
  const course: Point[] = [];
  const near = (p: Point, d: number) => course.find((q) => Math.abs(q[0] - p[0]) < d && Math.abs(q[1] - p[1]) < d);
  const highland: number[] = [];
  for (let c = 0; c < land.length; c += 3) if (land[c] && inland[c] >= 26) highland.push(c);
  for (let i = highland.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [highland[i], highland[j]] = [highland[j], highland[i]];
  }
  const sources: Point[] = [];
  for (const c of highland) {
    if (sources.length >= 22) break;
    const p = centreOf(coarse, c);
    if (sources.every((s) => Math.hypot(s[0] - p[0], s[1] - p[1]) > 64)) sources.push(p);
  }
  sources.sort((a, b) => inlandAt(b) - inlandAt(a));
  for (const source of sources) {
    if (near(source, 26)) continue;
    const line: Point[] = [source];
    let p = source;
    let heading = 0;
    let ended = false;
    for (let step = 0; step < 700; step++) {
      const gx = inlandAt([p[0] + 2, p[1]]) - inlandAt([p[0] - 2, p[1]]);
      const gy = inlandAt([p[0], p[1] + 2]) - inlandAt([p[0], p[1] - 2]);
      if (Math.hypot(gx, gy) > 0.05) heading = Math.atan2(-gy, -gx);
      const turn = (sway(p[0], p[1]) - 0.5) * 2.4;
      p = [p[0] + Math.cos(heading + turn) * 2.2, p[1] + Math.sin(heading + turn) * 2.2];
      line.push(p);
      if (inlandAt(p) <= 0.4) {
        ended = true;
        break;
      }
      const joined = step > 4 ? near(p, 3) : undefined;
      if (joined) {
        line.push(joined);
        ended = true;
        break;
      }
    }
    if (!ended || line.length < 16) continue;
    course.push(...line);
    for (const q of line) {
      const c = cellAt(coarse, q);
      if (c >= 0) river[c] = 1;
    }
    rivers.push(pathOf(thin(smooth(line, 2), 2.6)));
  }
  // Rivers keep a little clear ground on either bank.
  const nearRiver = distanceTo(coarse, river);

  // Sand along the stretches of shore where the coast is low.
  const shore = noise(rand, 90);
  const sand: string[] = [];
  for (let c = 0; c < land.length; c++) {
    if (!land[c] || inland[c] > 4 || rand() < 0.72) continue;
    const [x, y] = centreOf(coarse, c);
    if (shore(x, y) < 0.6) continue;
    sand.push(`M${Math.round(x + (rand() - 0.5) * 2)},${Math.round(y + (rand() - 0.5) * 2)}h.01`);
  }

  // Mountain ranges run along ridge lines (where a smooth noise crosses its
  // middle) over the high interior, with a few lone peaks; highest first.
  const ridgeA = noise(rand, 150);
  const ridgeB = noise(rand, 90);
  const ridge = ([x, y]: Point) =>
    Math.max(1 - Math.abs(2 * ridgeA(x, y) - 1), 0.92 * (1 - Math.abs(2 * ridgeB(x, y) - 1)));
  const hills: Realm["hills"] = [];
  for (let y = box[1]; y < box[3]; y += 12)
    for (let x = box[0]; x < box[2]; x += 12) {
      const p: Point = [x + (rand() - 0.5) * 9, y + (rand() - 0.5) * 9];
      const c = cellAt(coarse, p);
      if (c < 0 || !land[c] || nearRiver[c] < 7 || inland[c] < 24) continue;
      const crest = ridge(p);
      const lone = rand() < 0.012 && inland[c] > 40;
      if (crest < 0.9 && !lone) continue;
      const scale = 0.75 + Math.min(0.45, inland[c] / 300) + rand() * 0.2;
      hills.push({ at: p, scale, variant: Math.floor(rand() * HILLS.length) });
    }
  hills.sort((a, b) => inland[cellAt(coarse, b.at)] - inland[cellAt(coarse, a.at)]);

  // Fir woods in a few sheltered valleys.
  const woods = noise(rand, 44);
  const trees: Point[] = [];
  for (let y = box[1]; y < box[3]; y += 6)
    for (let x = box[0]; x < box[2]; x += 5) {
      const p: Point = [x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3];
      const c = cellAt(coarse, p);
      if (c < 0 || !land[c] || inland[c] < 6 || inland[c] > 44 || nearRiver[c] < 3) continue;
      if (woods(p[0], p[1]) < 0.72) continue;
      trees.push(p);
    }

  realmMemo = {
    rings,
    box,
    capital,
    fine,
    sea,
    coarse,
    land,
    inland,
    coast: rings.map(pathOf).join(""),
    water,
    rivers,
    river,
    sand: sand.join(""),
    hills,
    trees,
  };
  return realmMemo;
}

/** Distance from a point in realm coordinates to the land (0 on land, large off the grid). */
export function seaDistance(p: Point): number {
  const r = realm();
  const c = cellAt(r.fine, p);
  return c < 0 ? 999 : r.sea[c];
}

// ── Seats and territories ──────────────────────────────────────────────────

const seatMemo: number[] = [];

/**
 * Seat cells (coarse grid) in a fixed order: the capital, then each next
 * seat at the land farthest from every seat before it.
 */
export function seats(count: number): number[] {
  const r = realm();
  if (!seatMemo.length) seatMemo.push(cellAt(r.coarse, r.capital));
  if (seatMemo.length >= count) return seatMemo.slice(0, count);
  const candidates: number[] = [];
  for (let c = 0; c < r.land.length; c += 2) if (r.land[c] && r.inland[c] >= 10) candidates.push(c);
  const far = candidates.map((c) => {
    const [x, y] = centreOf(r.coarse, c);
    return Math.min(...seatMemo.map((s) => Math.hypot(centreOf(r.coarse, s)[0] - x, centreOf(r.coarse, s)[1] - y)));
  });
  while (seatMemo.length < count) {
    let best = 0;
    far.forEach((d, i) => (d > far[best] ? (best = i) : 0));
    const seat = candidates[best];
    seatMemo.push(seat);
    const [sx, sy] = centreOf(r.coarse, seat);
    candidates.forEach((c, i) => {
      const [x, y] = centreOf(r.coarse, c);
      far[i] = Math.min(far[i], Math.hypot(x - sx, y - sy));
    });
  }
  return seatMemo.slice(0, count);
}

/** Order in which friends claim the base territories: nearest the capital first. */
export function claimOrder(): number[] {
  const r = realm();
  const s = seats(BASE);
  const [cx, cy] = r.capital;
  return s
    .map((c, i) => ({ i, d: Math.hypot(centreOf(r.coarse, c)[0] - cx, centreOf(r.coarse, c)[1] - cy) }))
    .slice(1)
    .sort((a, b) => a.d - b.d)
    .map((o) => o.i);
}

export interface Territory {
  /** Index of the seat; also the territory's id on the page. */
  seat: number;
  at: Point;
  /** Outline in realm coordinates, reaching a little out to sea (it is clipped to the coast). */
  path: string;
  /** Land cells it holds. */
  cells: number;
  /** The point deepest inside it, and how far that is from its edge. */
  pole: Point;
  room: number;
  /** Points along its stretch of coast, for a name that has to be set out at sea. */
  shore: Point[];
}

const partitionMemo = new Map<number, Territory[]>();

/** The land divided among `count` seats. */
export function partition(count: number): Territory[] {
  const known = partitionMemo.get(count);
  if (known) return known;
  const r = realm();
  const g = r.coarse;
  const s = seats(count);
  // Borders wander with the lie of the land and like to follow rivers;
  // territories reach a little way out to sea so the coast can clip them.
  const borderRand = random("pioneer-chart:borders");
  const broad = noise(borderRand, 52);
  const fine = noise(borderRand, 15);
  const offshore = distanceTo(g, r.land);
  const cost = new Float32Array(r.land.length);
  for (let c = 0; c < cost.length; c++) {
    const [x, y] = centreOf(g, c);
    if (r.land[c]) cost[c] = (0.6 + 3 * broad(x, y) ** 2 + 1.2 * fine(x, y)) * (r.river[c] ? 5 : 1);
    else cost[c] = offshore[c] <= 16 ? 3 : Infinity;
  }
  const label = grow(g, cost, s);

  // Distance from each land cell to its territory's edge (a border or the sea).
  const edge = new Uint8Array(label.length);
  for (let c = 0; c < label.length; c++) {
    if (!r.land[c]) {
      edge[c] = 1;
      continue;
    }
    const x = c % g.w;
    for (const n of [c - 1, c + 1, c - g.w, c + g.w])
      if (n >= 0 && n < label.length && Math.abs((n % g.w) - x) <= 1 && label[n] !== label[c]) edge[c] = 1;
  }
  const room = distanceTo(g, edge);

  const out: Territory[] = s.map((seat, k) => {
    let x0 = g.w;
    let y0 = g.h;
    let x1 = 0;
    let y1 = 0;
    let cells = 0;
    let pole = seat;
    const shore: Point[] = [];
    for (let c = 0; c < label.length; c++) {
      if (label[c] !== k) continue;
      const x = c % g.w;
      const y = (c - x) / g.w;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      if (r.land[c]) {
        cells++;
        if (room[c] > room[pole]) pole = c;
        if (r.inland[c] <= 2 && (x + y) % 3 === 0) shore.push(centreOf(g, c));
      }
    }
    // Outline: the 0.5 contour of the territory's indicator, on a window round it.
    const sub: Grid = {
      x0: g.x0 + (x0 - 2) * g.res,
      y0: g.y0 + (y0 - 2) * g.res,
      res: g.res,
      w: x1 - x0 + 5,
      h: y1 - y0 + 5,
    };
    const mask = new Float32Array(sub.w * sub.h);
    for (let y = 0; y < sub.h; y++)
      for (let x = 0; x < sub.w; x++) {
        const gx = x0 - 2 + x;
        const gy = y0 - 2 + y;
        if (gx >= 0 && gy >= 0 && gx < g.w && gy < g.h && label[gy * g.w + gx] === k) mask[y * sub.w + x] = 1;
      }
    const path = contours(sub, mask, 0.5)
      .filter((l) => l.length > 4)
      .map((l) => pathOf(thin(smooth(l, 2), 2.6), 0))
      .join("");
    return { seat: k, at: centreOf(g, seat), path, cells, pole: centreOf(g, pole), room: room[pole], shore };
  });
  partitionMemo.set(count, out);
  return out;
}

// ── The sheet ──────────────────────────────────────────────────────────────

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ChartLabel {
  /** Centre of the first baseline. */
  at: Point;
  lines: Array<{ text: string; lang: Lang; size: number; alt: boolean }>;
  /** A name set out at sea: a fine line from the name to a point inside its territory. */
  leader?: [Point, Point];
}

export type TerritoryKind = "home" | "charted" | "next" | "blank";

export interface ChartPlace {
  seat: number;
  kind: TerritoryKind;
  /** 1-based number on the index, by order of charting; 0 for the home province and blank land. */
  number: number;
  link: FriendLink | null;
  wash: string;
  grid: string;
  /** Label anchor on the sheet (centre of the first baseline). */
  label: ChartLabel | null;
  /** Where the slip opens, on the sheet. */
  pole: Point;
}

export interface Chart {
  shape: ChartShape;
  size: Point;
  /** SVG transform from realm coordinates to the sheet. */
  transform: string;
  places: ChartPlace[];
  capital: { at: Point; label: ChartLabel };
  incognita: ChartLabel | null;
  grid: { columns: string[]; rows: string[]; xs: number[]; ys: number[] };
  rose: { at: Point; radius: number };
  title: Box;
  sea: { at: Point; text: string; alt: string } | null;
  soundings: Array<{ at: Point; depth: number }>;
  /** Hills and trees placed for this sheet, upright, back to front. */
  hills: Array<{ at: Point; scale: number; variant: number }>;
  trees: Point[];
}

const COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

/** Friends in charting order: by the date the friendship began, then by id. */
export function chartingOrder(links: FriendLink[]): FriendLink[] {
  return [...links].sort((a, b) => a.since.localeCompare(b.since) || a.id.localeCompare(b.id));
}

/** Blank territories left for the next friends to claim. */
export const blankCount = (links: number) => Math.max(0, BASE - 1 - links);

/** Which seat each friend holds, which seat is next to be claimed, and how many seats there are. */
export function claims(count: number): { seats: number; held: number[]; next: number | null } {
  const order = claimOrder();
  if (count <= order.length) return { seats: BASE, held: order.slice(0, count), next: order[count] ?? null };
  return {
    seats: count + 1,
    held: [...order, ...Array.from({ length: count - order.length }, (_, i) => BASE + i)],
    next: null,
  };
}

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/**
 * Lay out the chart for `links` on a wide or tall sheet. `lang` decides which
 * name leads on each label.
 */
export function chart(links: FriendLink[], shape: ChartShape, lang: Lang): Chart {
  const zh = lang === "zh";
  const other: Lang = zh ? "en" : "zh";
  const sheet = SHEETS[shape];
  const t = sheet.type;
  const [W, H] = sheet.size;
  const [cx, cy] = sheet.centre;
  const r = realm();
  // Realm → sheet: wide is north up; tall is turned a quarter to the right.
  const toSheet = ([x, y]: Point): Point => (shape === "wide" ? [x + cx, y + cy] : [-y + cx, x + cy]);
  const toRealm = ([x, y]: Point): Point => (shape === "wide" ? [x - cx, y - cy] : [y - cy, -(x - cx)]);
  const transform = shape === "wide" ? `translate(${cx} ${cy})` : `translate(${cx} ${cy}) rotate(90)`;

  const ordered = chartingOrder(links);
  const { seats: count, held, next } = claims(ordered.length);
  const territories = partition(count);

  // ── Grid: lettered columns and numbered rows, for the index ──
  const across = shape === "wide" ? 8 : 5;
  const down = shape === "wide" ? 5 : 8;
  const xs = Array.from({ length: across + 1 }, (_, i) => (i * W) / across);
  const ys = Array.from({ length: down + 1 }, (_, i) => (i * H) / down);
  const gridRef = ([x, y]: Point) =>
    `${COLUMNS[Math.min(across - 1, Math.max(0, Math.floor((x / W) * across)))]}${Math.min(down, Math.max(1, Math.floor((y / H) * down) + 1))}`;

  // ── Open sea: the title and the rose take their corners first ──
  const openSea = (box: Box, clear: number) => {
    for (let y = box.y0; y <= box.y1; y += 12)
      for (let x = box.x0; x <= box.x1; x += 12) if (seaDistance(toRealm([x, y])) < clear) return false;
    return box.x0 >= 20 && box.y0 >= 20 && box.x1 <= W - 20 && box.y1 <= H - 20;
  };
  const titleSize: Point = shape === "wide" ? [300, 196] : [600, 310];
  const corners: Point[] = [
    [44, 44],
    [44, H - 44 - titleSize[1]],
    [W - 44 - titleSize[0], 44],
    [W - 44 - titleSize[0], H - 44 - titleSize[1]],
  ];
  const titleAt =
    corners.find(([x, y]) => openSea({ x0: x, y0: y, x1: x + titleSize[0], y1: y + titleSize[1] }, 24)) ?? corners[0];
  const title: Box = { x0: titleAt[0], y0: titleAt[1], x1: titleAt[0] + titleSize[0], y1: titleAt[1] + titleSize[1] };

  const roseR = shape === "wide" ? 60 : 96;
  const roseSpots: Point[] = [
    [W - roseR - 70, H - roseR - 70],
    [roseR + 70, H - roseR - 70],
    [W - roseR - 70, roseR + 70],
    [roseR + 70, roseR + 70],
  ];
  const roseBox = ([x, y]: Point): Box => ({
    x0: x - roseR - 30,
    y0: y - roseR - 40,
    x1: x + roseR + 30,
    y1: y + roseR + 30,
  });
  const rose = {
    at:
      roseSpots.find((p) => overlap(roseBox(p), title) === 0 && openSea(roseBox(p), 16)) ??
      roseSpots.find((p) => overlap(roseBox(p), title) === 0)!,
    radius: roseR,
  };

  const taken: Box[] = [title, roseBox(rose.at)];

  // ── Names ──
  const boxOf = (l: ChartLabel): Box => {
    const width = Math.max(...l.lines.map((x) => emWidth(x.text, x.alt) * x.size * (x.alt ? 1 : 1.12)));
    const height = l.lines.reduce((s, x, i) => s + x.size * (i ? 1.3 : 1), 0);
    return {
      x0: l.at[0] - width / 2 - 4,
      x1: l.at[0] + width / 2 + 4,
      y0: l.at[1] - l.lines[0].size * 0.9,
      y1: l.at[1] + height - l.lines[0].size + 4,
    };
  };
  /** A name split over two lines, at a space or (for Chinese) in the middle. */
  const wrap = (text: string): [string, string] | null => {
    const spaces = [...text.matchAll(/ /g)].map((m) => m.index!);
    if (spaces.length) {
      const cut = spaces.reduce((a, b) => (Math.abs(b - text.length / 2) < Math.abs(a - text.length / 2) ? b : a));
      return [text.slice(0, cut), text.slice(cut + 1)];
    }
    const chars = [...text];
    return chars.length >= 5
      ? [chars.slice(0, Math.ceil(chars.length / 2)).join(""), chars.slice(Math.ceil(chars.length / 2)).join("")]
      : null;
  };
  /** The name set inside the territory, on one line or two, as large as its room allows. */
  const inside = (text: string, room: number, max: number): Array<{ text: string; size: number }> | null => {
    const span = room * 2 * 0.88;
    const one = Math.min(max, span / Math.max(1, emWidth(text) * 1.12));
    // A short name is kept whole even a little under the smallest size.
    if (one >= t.nameMin * 0.88) return [{ text, size: one }];
    const two = wrap(text);
    if (!two) return null;
    const size = Math.min(max, span / Math.max(...two.map((x) => emWidth(x) * 1.12)), (room * 1.6) / 2.3);
    return size >= t.nameMin ? two.map((x) => ({ text: x, size })) : null;
  };

  const capital = toSheet(r.capital);
  const capitalLabel: ChartLabel = {
    at: [capital[0], capital[1] + t.alt * 2.1],
    lines: [{ text: zh ? "首府 · 本港" : "Capital · home port", lang, size: t.alt, alt: true }],
  };
  taken.push(boxOf(capitalLabel), {
    x0: capital[0] - 10,
    x1: capital[0] + 10,
    y0: capital[1] - 10,
    y1: capital[1] + 10,
  });

  const places: ChartPlace[] = territories.map((tr) => {
    const charted = held.indexOf(tr.seat);
    const link = charted >= 0 ? ordered[charted] : null;
    const kind: TerritoryKind = tr.seat === 0 ? "home" : link ? "charted" : tr.seat === next ? "next" : "blank";
    const pole = toSheet(tr.pole);
    return {
      seat: tr.seat,
      kind,
      number: charted >= 0 ? charted + 1 : 0,
      link,
      wash: tr.seat === 0 ? HOME_WASH : link ? WASHES[charted % WASHES.length] : "transparent",
      grid: gridRef(pole),
      label: null,
      pole,
    };
  });

  // Names that fit are set inside their territories, largest room first.
  const pending: ChartPlace[] = [];
  [...places]
    .sort((a, b) => territories[b.seat].room - territories[a.seat].room)
    .forEach((p) => {
      const tr = territories[p.seat];
      const name = p.kind === "home" ? (zh ? "先锋维基" : "Pioneer Wiki") : p.link?.name[lang];
      if (p.kind === "next") {
        p.label = {
          at: p.pole,
          lines: [
            { text: `No. ${ordered.length + 1}`, lang, size: t.alt, alt: true },
            { text: zh ? "虚位以待" : "awaiting a friend", lang, size: t.alt, alt: true },
          ],
        };
        taken.push(boxOf(p.label));
      }
      if (!name) return;
      const set = inside(name, tr.room, p.kind === "home" ? t.home : t.nameMax);
      if (!set) return pending.push(p);
      const lines: ChartLabel["lines"] = set.map((x) => ({ text: x.text, lang, size: x.size, alt: false }));
      const alt = p.kind === "home" ? (zh ? "Pioneer Wiki" : "先锋维基") : p.link!.name[other];
      if (
        alt !== name &&
        emWidth(alt, true) * t.alt <= tr.room * 1.8 &&
        tr.room > set[0].size * set.length * 0.9 + t.alt
      )
        lines.push({ text: alt, lang: other, size: t.alt, alt: true });
      // Centre the block on the pole.
      const block = lines.reduce((s, x, i) => s + x.size * (i ? 1.3 : 1), 0);
      p.label = { at: [p.pole[0], p.pole[1] - block / 2 + lines[0].size * 0.8], lines };
      taken.push(boxOf(p.label));
    });

  // The rest are set out at sea off their own coast, with a leader to it, as
  // engravers did for small provinces; failing that, only the number (the
  // home province then goes by its starred capital alone).
  for (const p of pending) {
    const tr = territories[p.seat];
    const text = p.kind === "home" ? (zh ? "先锋维基" : "Pioneer Wiki") : p.link!.name[lang];
    const size = t.nameMin * 1.1;
    let best: { label: ChartLabel; score: number } | null = null;
    const step = Math.max(1, Math.floor(tr.shore.length / 40));
    for (let i = 0; i < tr.shore.length; i += step) {
      const s = tr.shore[i];
      const away: Point = [s[0] - tr.pole[0], s[1] - tr.pole[1]];
      const len = Math.hypot(...away) || 1;
      for (const reach of [26, 40, 56, 74]) {
        const at = toSheet([s[0] + (away[0] / len) * reach, s[1] + (away[1] / len) * reach]);
        const label: ChartLabel = { at, lines: [{ text, lang, size, alt: false }] };
        const box = boxOf(label);
        if (!openSea(box, 7) || taken.some((b) => overlap(b, box) > 0)) continue;
        const score = reach + Math.abs(at[1] - toSheet(s)[1]) * 0.3;
        if (!best || score < best.score) {
          const sheetShore = toSheet(s);
          const anchor: Point = [
            Math.max(box.x0, Math.min(box.x1, sheetShore[0])),
            Math.max(box.y0, Math.min(box.y1, sheetShore[1])),
          ];
          const inward = toSheet([s[0] - (away[0] / len) * 5, s[1] - (away[1] / len) * 5]);
          best = { label: { ...label, leader: [anchor, inward] }, score };
        }
      }
    }
    p.label =
      best?.label ??
      (p.kind === "home"
        ? null
        : { at: p.pole, lines: [{ text: String(p.number), lang, size: t.number, alt: false }] });
    if (p.label) taken.push(boxOf(p.label));
  }

  // The largest stretch of blank land is lettered "terra incognita".
  const blank = territories.filter((tr) => places[tr.seat].kind === "blank").sort((a, b) => b.room - a.room)[0];
  const incognita: ChartLabel | null = blank
    ? {
        at: toSheet(blank.pole),
        lines: [
          { text: zh ? "未勘之地" : "Terra incognita", lang, size: t.alt * 1.15, alt: true },
          { text: zh ? "Terra incognita" : "未勘之地", lang: other, size: t.alt * 0.9, alt: true },
        ],
      }
    : null;
  if (incognita) taken.push(boxOf(incognita));

  const seaText = zh ? "友 邻 之 海" : "MARE AMICORUM";
  const seaAlt = zh ? "Mare Amicorum" : "友邻之海";
  const seaW = emWidth(seaText, true) * t.sea * 1.3;
  let sea: Chart["sea"] = null;
  for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) {
    for (const fx of [0.12, 0.88, 0.5, 0.25, 0.75]) {
      const at: Point = [W * fx, H * fy];
      const box: Box = { x0: at[0] - seaW / 2, x1: at[0] + seaW / 2, y0: at[1] - t.sea, y1: at[1] + t.sea * 1.2 };
      if (openSea(box, 30) && taken.every((b) => overlap(b, box) === 0)) {
        sea = { at, text: seaText, alt: seaAlt };
        taken.push(box);
        break;
      }
    }
    if (sea) break;
  }

  const soundings: Chart["soundings"] = [];
  const soundRand = random(`pioneer-chart:soundings:${shape}`);
  const pitch = shape === "wide" ? 70 : 112;
  for (let y = pitch / 2; y < H; y += pitch)
    for (let x = pitch / 2; x < W; x += pitch) {
      const p: Point = [x + (soundRand() - 0.5) * pitch * 0.7, y + (soundRand() - 0.5) * pitch * 0.7];
      if (soundRand() < 0.55) continue;
      const d = seaDistance(toRealm(p));
      if (d < 34 || p[0] < 50 || p[1] < 50 || p[0] > W - 50 || p[1] > H - 50) continue;
      if (taken.some((b) => p[0] > b.x0 - 14 && p[0] < b.x1 + 14 && p[1] > b.y0 - 14 && p[1] < b.y1 + 14)) continue;
      soundings.push({ at: p, depth: Math.round(4 + Math.min(d, 400) / 13 + soundRand() * 4) });
    }

  // ── Hills and trees, upright on this sheet, clear of the type ──
  const g = sheet.glyph;
  const typeBoxes = taken;
  const hills: Chart["hills"] = [];
  const hillBoxes: Box[] = [];
  for (const hill of r.hills) {
    const at = toSheet(hill.at);
    const scale = hill.scale * g;
    const { h: rise, lean } = HILLS[hill.variant];
    const w = HILL_WIDTH * scale;
    const h = w * rise;
    const box: Box = { x0: at[0] - w / 2, x1: at[0] + w / 2, y0: at[1] - h, y1: at[1] + 1 };
    if (typeBoxes.some((b) => overlap(b, box) > 0)) continue;
    // Peaks in a range crowd each other, but never stand on top of one another.
    if (hillBoxes.some((b) => overlap(b, box) > w * h * 0.3)) continue;
    // The whole hill stands on land.
    const feet: Point[] = [
      [box.x0, at[1]],
      [box.x1, at[1]],
      [at[0] + lean * w, box.y0],
    ];
    if (feet.some((p) => seaDistance(toRealm(p)) > 0)) continue;
    hills.push({ at, scale, variant: hill.variant });
    hillBoxes.push(box);
  }
  hills.sort((a, b) => a.at[1] - b.at[1]);
  const trees: Point[] = [];
  for (const p0 of r.trees) {
    const p = toSheet(p0);
    const box: Box = { x0: p[0] - 2.2 * g, x1: p[0] + 2.2 * g, y0: p[1] - 6 * g, y1: p[1] + 1.5 * g };
    if (typeBoxes.some((b) => overlap(b, box) > 0) || hillBoxes.some((b) => overlap(b, box) > 0)) continue;
    // On the tall sheet the firs are larger, so fewer of them fit.
    if (g > 1 && trees.some((q) => Math.abs(q[0] - p[0]) < 4.2 * g && Math.abs(q[1] - p[1]) < 5 * g)) continue;
    trees.push(p);
  }
  trees.sort((a, b) => a[1] - b[1]);

  return {
    shape,
    size: sheet.size,
    transform,
    places,
    capital: { at: capital, label: capitalLabel },
    incognita,
    grid: {
      columns: COLUMNS.slice(0, across).split(""),
      rows: Array.from({ length: down }, (_, i) => String(i + 1)),
      xs,
      ys,
    },
    rose,
    title,
    sea,
    soundings,
    hills,
    trees,
  };
}

// ── Glyphs ─────────────────────────────────────────────────────────────────

const bez = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;

/**
 * A hill in profile, standing on (x, y): a filled body, its outline, and the
 * shading on the lower-right flank (light falls from the upper left).
 */
export function hillGlyph([x, y]: Point, w: number, h: number, lean: number): { body: string; line: string } {
  const px = x + lean * w;
  const py = y - h;
  const left: Point[] = [
    [x - w / 2, y],
    [x - w * 0.3, y - h * 0.4],
    [px - w * 0.14, py + h * 0.04],
    [px, py],
  ];
  const right: Point[] = [
    [px, py],
    [px + w * 0.14, py + h * 0.04],
    [x + w * 0.32, y - h * 0.38],
    [x + w / 2, y],
  ];
  const curve = (c: Point[]) => `C${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`;
  const shade: string[] = [];
  const strokes = Math.max(3, Math.round(w / 2.1));
  for (let j = 1; j < strokes; j++) {
    const t = j / strokes;
    const fx = bez(right[0][0], right[1][0], right[2][0], right[3][0], t);
    const fy = bez(right[0][1], right[1][1], right[2][1], right[3][1], t);
    const len = Math.min(y - fy - 0.6, h * (0.75 - t * 0.35));
    if (len > 0.8) shade.push(`M${pt([fx - 0.25, fy + 0.7])}L${pt([fx - 0.25 - len * 0.12, fy + 0.7 + len])}`);
  }
  for (const t of [0.72, 0.84]) {
    const fx = bez(left[0][0], left[1][0], left[2][0], left[3][0], t);
    const fy = bez(left[0][1], left[1][1], left[2][1], left[3][1], t);
    shade.push(`M${pt([fx + 0.5, fy + 0.9])}L${pt([fx + 0.9, fy + 0.9 + h * 0.18])}`);
  }
  return {
    body: `M${pt(left[0])}${curve(left)}${curve(right)}Q${pt([x, y + h * 0.08])} ${pt(left[0])}Z`,
    line: `M${pt(left[0])}${curve(left)}${curve(right)}${shade.join("")}`,
  };
}
