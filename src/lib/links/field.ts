/*
 * Raster helpers for the Links chart. The land is laid on a grid so that
 * water lines can be drawn as distance contours, territories grown over the
 * land, rivers run downhill and relief placed by how far inland a point lies.
 * Grids store one value per cell, read at the cell's centre; all distances
 * are in map units.
 */

export type Point = [number, number];

export interface Grid {
  /** World position of the grid's top-left corner. */
  x0: number;
  y0: number;
  /** Cell size in map units. */
  res: number;
  w: number;
  h: number;
}

export const gridOver = (x0: number, y0: number, x1: number, y1: number, res: number): Grid => ({
  x0,
  y0,
  res,
  w: Math.ceil((x1 - x0) / res),
  h: Math.ceil((y1 - y0) / res),
});

export const centreOf = (g: Grid, cell: number): Point => [
  g.x0 + ((cell % g.w) + 0.5) * g.res,
  g.y0 + (Math.floor(cell / g.w) + 0.5) * g.res,
];

export const cellAt = (g: Grid, [x, y]: Point): number => {
  const i = Math.floor((x - g.x0) / g.res);
  const j = Math.floor((y - g.y0) / g.res);
  return i < 0 || j < 0 || i >= g.w || j >= g.h ? -1 : j * g.w + i;
};

/** Even–odd fill of `rings`, sampled at cell centres: 1 inside, 0 outside. */
export function rasterize(g: Grid, rings: Point[][]): Uint8Array {
  const out = new Uint8Array(g.w * g.h);
  const xs: number[] = [];
  for (let j = 0; j < g.h; j++) {
    const y = g.y0 + (j + 0.5) * g.res;
    xs.length = 0;
    for (const ring of rings)
      for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
        const [xa, ya] = ring[a];
        const [xb, yb] = ring[b];
        if (ya > y !== yb > y) xs.push(xa + ((y - ya) / (yb - ya)) * (xb - xa));
      }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil((xs[k] - g.x0) / g.res - 0.5));
      const to = Math.min(g.w - 1, Math.floor((xs[k + 1] - g.x0) / g.res - 0.5));
      for (let i = from; i <= to; i++) out[j * g.w + i] = 1;
    }
  }
  return out;
}

/** One-dimensional squared distance transform (Felzenszwalb & Huttenlocher). */
function transform1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) ** 2 + f[v[k]];
  }
}

/** Exact Euclidean distance from every cell to the nearest cell where `target` is set. */
export function distanceTo(g: Grid, target: Uint8Array): Float32Array {
  const { w, h } = g;
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const sq = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) sq[i] = target[i] ? 0 : 1e20;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = sq[y * w + x];
    transform1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) sq[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = sq[y * w + x];
    transform1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) sq[y * w + x] = d[x];
  }
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(sq[i]) * g.res;
  return out;
}

/*
 * Marching squares. Corners a b / d c of each square; a set bit means the
 * corner lies above the level. Edges: 0 top (a–b), 1 right (b–c), 2 bottom
 * (d–c), 3 left (a–d). Saddles (5, 10) are split by the value at the centre.
 */
const CASES: Array<Array<[number, number]>> = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [],
  [[0, 2]],
  [[3, 2]],
  [[2, 3]],
  [[0, 2]],
  [],
  [[1, 2]],
  [[3, 1]],
  [[0, 1]],
  [[3, 0]],
  [],
];

/** Iso-lines of `field` at `level`, joined into polylines; closed loops end on their first point. */
export function contours(g: Grid, field: ArrayLike<number>, level: number): Point[][] {
  const { w, h } = g;
  const at = new Map<number, Point>();
  const links = new Map<number, number[]>();
  const value = (i: number, j: number) => field[j * w + i];
  const edgeId = (i: number, j: number, e: number) =>
    e === 0
      ? (j * w + i) * 2
      : e === 1
        ? (j * w + i + 1) * 2 + 1
        : e === 2
          ? ((j + 1) * w + i) * 2
          : (j * w + i) * 2 + 1;
  const point = (i: number, j: number, e: number): Point => {
    const [pi, pj, qi, qj] =
      e === 0
        ? [i, j, i + 1, j]
        : e === 1
          ? [i + 1, j, i + 1, j + 1]
          : e === 2
            ? [i, j + 1, i + 1, j + 1]
            : [i, j, i, j + 1];
    const vp = value(pi, pj);
    const vq = value(qi, qj);
    const t = vq === vp ? 0.5 : (level - vp) / (vq - vp);
    return [g.x0 + (pi + 0.5 + (qi - pi) * t) * g.res, g.y0 + (pj + 0.5 + (qj - pj) * t) * g.res];
  };
  const join = (i: number, j: number, e1: number, e2: number) => {
    const a = edgeId(i, j, e1);
    const b = edgeId(i, j, e2);
    if (!at.has(a)) at.set(a, point(i, j, e1));
    if (!at.has(b)) at.set(b, point(i, j, e2));
    const la = links.get(a);
    if (la) la.push(b);
    else links.set(a, [b]);
    const lb = links.get(b);
    if (lb) lb.push(a);
    else links.set(b, [a]);
  };
  for (let j = 0; j < h - 1; j++)
    for (let i = 0; i < w - 1; i++) {
      const va = value(i, j);
      const vb = value(i + 1, j);
      const vc = value(i + 1, j + 1);
      const vd = value(i, j + 1);
      const k = (va > level ? 1 : 0) | (vb > level ? 2 : 0) | (vc > level ? 4 : 0) | (vd > level ? 8 : 0);
      if (k === 5 || k === 10) {
        const centre = (va + vb + vc + vd) / 4 > level;
        if ((k === 5) === centre) {
          join(i, j, 0, 1);
          join(i, j, 2, 3);
        } else {
          join(i, j, 3, 0);
          join(i, j, 1, 2);
        }
      } else for (const [e1, e2] of CASES[k]) join(i, j, e1, e2);
    }

  const used = new Set<number>();
  const lines: Point[][] = [];
  const walk = (start: number) => {
    const line: Point[] = [at.get(start)!];
    used.add(start);
    let cur = start;
    for (;;) {
      const next = (links.get(cur) ?? []).find((n) => !used.has(n));
      if (next === undefined) {
        if ((links.get(cur) ?? []).includes(start) && line.length > 2) line.push(line[0]);
        break;
      }
      used.add(next);
      line.push(at.get(next)!);
      cur = next;
    }
    lines.push(line);
  };
  for (const [id, list] of links) if (list.length === 1 && !used.has(id)) walk(id);
  for (const id of links.keys()) if (!used.has(id)) walk(id);
  return lines;
}

/** Chaikin corner cutting; closed lines (first point repeated last) stay closed. */
export function smooth(line: Point[], rounds = 2): Point[] {
  const closed = line.length > 2 && line[0][0] === line.at(-1)![0] && line[0][1] === line.at(-1)![1];
  let pts = closed ? line.slice(0, -1) : line;
  for (let r = 0; r < rounds; r++) {
    const out: Point[] = closed ? [] : [pts[0]];
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % n];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    if (!closed) out.push(pts[n - 1]);
    pts = out;
  }
  return closed ? [...pts, pts[0]] : pts;
}

/** Drops points closer than `step` to the last one kept. */
export function thin(line: Point[], step: number): Point[] {
  const out: Point[] = [line[0]];
  for (let i = 1; i < line.length - 1; i++) {
    const [x, y] = out[out.length - 1];
    if (Math.hypot(line[i][0] - x, line[i][1] - y) >= step) out.push(line[i]);
  }
  out.push(line[line.length - 1]);
  return out;
}

/** Smooth value noise in [0, 1], seeded and tileless. */
export function noise(rand: () => number, scale: number): (x: number, y: number) => number {
  const table = Float32Array.from({ length: 256 }, rand);
  const perm = Uint8Array.from({ length: 512 }, (_, i) => i & 255);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const lattice = (i: number, j: number) => table[perm[(perm[i & 255] + j) & 255]];
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const fx = x / scale;
    const fy = y / scale;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const u = ease(fx - i);
    const v = ease(fy - j);
    const top = lattice(i, j) * (1 - u) + lattice(i + 1, j) * u;
    const bottom = lattice(i, j + 1) * (1 - u) + lattice(i + 1, j + 1) * u;
    return top * (1 - v) + bottom * v;
  };
}

/**
 * Grow regions from `seeds` (cell indices) over the grid by cheapest path,
 * with `cost` per cell (Infinity = impassable). Every reachable cell gets
 * the index of the seed that reaches it first; the rest stay -1.
 */
export function grow(g: Grid, cost: Float32Array, seeds: number[]): Int16Array {
  const n = g.w * g.h;
  const label = new Int16Array(n).fill(-1);
  const dist = new Float64Array(n).fill(Infinity);
  // Binary heap of (distance, cell), with stale entries skipped.
  let keys = new Float64Array(1024);
  let cells = new Int32Array(1024);
  let size = 0;
  const push = (k: number, c: number) => {
    if (size === keys.length) {
      const k2 = new Float64Array(size * 2);
      k2.set(keys);
      keys = k2;
      const c2 = new Int32Array(size * 2);
      c2.set(cells);
      cells = c2;
    }
    let i = size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= k) break;
      keys[i] = keys[p];
      cells[i] = cells[p];
      i = p;
    }
    keys[i] = k;
    cells[i] = c;
  };
  const pop = () => {
    const top = cells[0];
    const k = keys[--size];
    const c = cells[size];
    let i = 0;
    for (;;) {
      let m = i * 2 + 1;
      if (m >= size) break;
      if (m + 1 < size && keys[m + 1] < keys[m]) m++;
      if (keys[m] >= k) break;
      keys[i] = keys[m];
      cells[i] = cells[m];
      i = m;
    }
    keys[i] = k;
    cells[i] = c;
    return top;
  };
  seeds.forEach((s, i) => {
    dist[s] = 0;
    label[s] = i;
    push(0, s);
  });
  const STEPS: Array<[number, number, number]> = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ];
  while (size) {
    const d0 = keys[0];
    const c = pop();
    if (d0 > dist[c]) continue;
    const x = c % g.w;
    const y = (c - x) / g.w;
    for (const [dx, dy, len] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const nc = ny * g.w + nx;
      const step = ((cost[c] + cost[nc]) / 2) * len;
      if (!Number.isFinite(step)) continue;
      const nd = dist[c] + step;
      if (nd < dist[nc]) {
        dist[nc] = nd;
        label[nc] = label[c];
        push(nd, nc);
      }
    }
  }
  return label;
}
