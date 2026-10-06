#!/usr/bin/env node
/**
 * Trace the land of the Links chart from a real coastline.
 *
 *   node tools/prepare-chart-realm.mjs <ne_10m_land.geojson> <ne_10m_minor_islands.geojson>
 *
 * Inputs are Natural Earth 1:10m "land" and "minor islands" (public domain,
 * https://www.naturalearthdata.com), e.g. from
 * github.com/nvkelso/natural-earth-vector/tree/master/geojson. Keep the
 * downloads outside the repository; only the traced result is committed.
 *
 * The realm is Iceland, mirrored east–west so it reads as an invented land
 * with a real coast: fjords, peninsulas, sandy southern shores and the
 * islands lying off it. Writes src/lib/links/realm.json in km, x east and y
 * south of the island's centre, with the capital's bay (Reykjavík's, before
 * mirroring) marked.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [landFile, minorFile] = process.argv.slice(2);
if (!landFile || !minorFile) {
  console.error("usage: node tools/prepare-chart-realm.mjs <ne_10m_land.geojson> <ne_10m_minor_islands.geojson>");
  process.exit(1);
}

const REALM = { name: "Iceland, mirrored", at: [-18.5, 64.9], capital: [-21.93, 64.15] };
/** Douglas–Peucker tolerance in km: keeps every fjord the 1:10m data has, drops collinear points. */
const TOLERANCE = 0.3;

const polygons = [];
for (const file of [landFile, minorFile]) {
  for (const feature of JSON.parse(readFileSync(file, "utf8")).features) {
    const g = feature.geometry;
    const list = g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : [];
    for (const p of list) polygons.push(p[0]);
  }
}

const inside = (ring, [x, y]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const bbox = (ring) => {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/** Douglas–Peucker on an open polyline. */
function simplifyLine(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = len
        ? Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / len
        : Math.hypot(px - ax, py - ay);
      if (d > far) [far, at] = [d, i];
    }
    if (far > tolerance) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A closed ring is cut at the point farthest from its start and simplified as two lines. */
function simplifyRing(ring, tolerance) {
  const open = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  let far = 0;
  open.forEach(([x, y], i) => {
    if (Math.hypot(x - open[0][0], y - open[0][1]) > Math.hypot(open[far][0] - open[0][0], open[far][1] - open[0][1]))
      far = i;
  });
  const a = simplifyLine(open.slice(0, far + 1), tolerance);
  const b = simplifyLine([...open.slice(far), open[0]], tolerance);
  return [...a, ...b.slice(1, -1)];
}

const main = polygons
  .filter((r) => inside(r, REALM.at))
  .sort((a, b) => bbox(a)[2] - bbox(a)[0] - (bbox(b)[2] - bbox(b)[0]))[0];
const [x0, y0, x1, y1] = bbox(main);
const pad = 0.6;
const offshore = polygons.filter((r) => {
  if (r === main) return false;
  const [a, b, c, d] = bbox(r);
  return a > x0 - pad && c < x1 + pad && b > y0 - pad * 0.5 && d < y1 + pad * 0.5;
});

const lon0 = (x0 + x1) / 2;
const lat0 = (y0 + y1) / 2;
const kx = Math.cos((lat0 * Math.PI) / 180) * 111.32;
// Mirrored east–west: x grows westward in the source.
const project = ([lon, lat]) => [-(lon - lon0) * kx, (lat0 - lat) * 110.57];
const round = ([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100];

// The two layers share some islets; keep one of each.
const centre = (r) => r.reduce(([sx, sy], [x, y]) => [sx + x / r.length, sy + y / r.length], [0, 0]);
const rings = [main, ...offshore]
  .map((r) => simplifyRing(r.map(project), TOLERANCE))
  .filter((r) => r.length >= 4)
  .filter((r, i, all) => {
    const [cx, cy] = centre(r);
    return !all.slice(0, i).some((o) => Math.hypot(centre(o)[0] - cx, centre(o)[1] - cy) < 0.5);
  })
  .map((r) => r.map(round));
console.log(`${REALM.name}: ${rings[0].length} points, ${rings.length - 1} islands offshore`);

writeFileSync(
  "src/lib/links/realm.json",
  JSON.stringify({
    source: "Natural Earth 1:10m land and minor islands (public domain), naturalearthdata.com",
    name: REALM.name,
    unit: "km, x east and y south of the centre",
    capital: round(project(REALM.capital)),
    rings,
  }) + "\n",
);
console.log("wrote src/lib/links/realm.json");
