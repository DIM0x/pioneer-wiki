import { TREE, normalise, polar } from "@/lib/taxonomy/tree";

/*
 * The camera over the tree of life. The tree is drawn in its own coordinates
 * (root at TREE.centre); the stage is the SVG's own size in CSS pixels, so type
 * set on the stage is exactly the size it says. A camera places the tree:
 *
 *   stage = O + T + Rot(r) · (fit · k) · (tree − c)
 *
 * with O the stage centre, c the root, T = (x, y) a pan in pixels, k the zoom
 * (1 = the whole tree and its bands fit) and r a rotation in degrees,
 * clockwise. Pure functions, no DOM.
 */

export interface Camera {
  x: number;
  y: number;
  k: number;
  r: number;
}

export interface View {
  width: number;
  height: number;
}

export type Point = [number, number];

/** The stage size used before the browser has measured it (server render and first paint). */
export const DEFAULT_VIEW: View = { width: 1200, height: 760 };
/** Stage type sizes, in CSS pixels: the stage is drawn at 1 unit = 1 pixel. */
export const TYPE = { leaf: 16, leafLatin: 12.5, genus: 13.5, family: 21, familyLatin: 13.5 } as const;
/** Gap between a species dot and its label. */
export const LABEL_GAP = 9;
/** Longest species label at zoom 1; it grows with the zoom, up to twice this. */
export const LABEL_CAP = 112;
/** Gap between the longest species label and the family arc. */
export const ARC_GAP = 16;
/** The family band outside its arc: the name and the Latin name beneath it. */
export const BAND_DEPTH = 7 + TYPE.family + 5 + TYPE.familyLatin;
/** Pixels kept outside the leaf ring at zoom 1, so nothing is ever cut off at the edge of the stage. */
export const BAND_RESERVE = LABEL_GAP + LABEL_CAP + ARC_GAP + BAND_DEPTH + 6;

/** The longest species label allowed at zoom k. */
export const labelCap = (k: number) => Math.round(LABEL_CAP * Math.min(2, Math.sqrt(Math.max(1, k))));

export const ZOOM = { min: 0.6, max: 6 } as const;
export const HOME: Camera = { x: 0, y: 0, k: 1, r: 0 };

const C: Point = [TREE.centre, TREE.centre];
const centreOf = (v: View): Point => [v.width / 2, v.height / 2];

const rot = ([x, y]: Point, degrees: number): Point => {
  const a = (degrees * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** Stage pixels per tree unit at zoom 1: the leaf ring and its bands fill the shorter side. */
export function fitOf(v: View): number {
  return Math.max(0.15, (Math.min(v.width, v.height) / 2 - BAND_RESERVE) / TREE.radius.leaf);
}

export const clampZoom = (k: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, k));

/** The SVG transform for a group drawn in tree coordinates. */
export function cameraTransform(c: Camera, v: View): string {
  const f = (n: number) => Math.round(n * 1000) / 1000;
  const [ox, oy] = centreOf(v);
  return `translate(${f(ox + c.x)} ${f(oy + c.y)}) rotate(${f(c.r)}) scale(${f(fitOf(v) * c.k)}) translate(${-C[0]} ${-C[1]})`;
}

export function treeToStage(c: Camera, q: Point, v: View): Point {
  const s = fitOf(v) * c.k;
  const [dx, dy] = rot([(q[0] - C[0]) * s, (q[1] - C[1]) * s], c.r);
  const [ox, oy] = centreOf(v);
  return [ox + c.x + dx, oy + c.y + dy];
}

export function stageToTree(c: Camera, p: Point, v: View): Point {
  const s = fitOf(v) * c.k;
  const [ox, oy] = centreOf(v);
  const [dx, dy] = rot([p[0] - ox - c.x, p[1] - oy - c.y], -c.r);
  return [C[0] + dx / s, C[1] + dy / s];
}

/** Zoom by `factor`, keeping the tree point under stage point `p` where it is. */
export function zoomAbout(c: Camera, p: Point, factor: number, v: View): Camera {
  const k = clampZoom(c.k * factor);
  const s = k / c.k;
  const [ox, oy] = centreOf(v);
  return { ...c, k, x: p[0] - ox - s * (p[0] - ox - c.x), y: p[1] - oy - s * (p[1] - oy - c.y) };
}

/** Turn by `degrees` about stage point `p` (the stage centre by default). */
export function rotateAbout(c: Camera, degrees: number, v: View, p: Point = centreOf(v)): Camera {
  const [ox, oy] = centreOf(v);
  const [x, y] = rot([ox + c.x - p[0], oy + c.y - p[1]], degrees);
  return { ...c, r: c.r + degrees, x: p[0] - ox + x, y: p[1] - oy + y };
}

export function pan(c: Camera, dx: number, dy: number): Camera {
  return { ...c, x: c.x + dx, y: c.y + dy };
}

/**
 * A camera that turns the tree point at [angle, radius] to three o'clock —
 * where radial labels read straight across — zoomed to `k`, with that point on
 * stage point `anchor`. `from` picks the turn closest to the current one.
 */
export function focusCamera(angle: number, radius: number, k: number, anchor: Point, from: Camera, v: View): Camera {
  const kk = clampZoom(k);
  const target = 90 - angle;
  const r = from.r + (((normalise(target - from.r) + 180) % 360) - 180);
  const q = polar(angle, radius);
  const s = fitOf(v) * kk;
  const [dx, dy] = rot([(q[0] - C[0]) * s, (q[1] - C[1]) * s], r);
  const [ox, oy] = centreOf(v);
  return { k: kk, r, x: anchor[0] - ox - dx, y: anchor[1] - oy - dy };
}

/** The tree point at the centre of the stage. */
export function viewCentre(c: Camera, v: View): Point {
  return stageToTree(c, centreOf(v), v);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A flight between two cameras: the view centre glides, the turn takes the
 * short way round, and over a long distance the camera pulls back mid-way and
 * pushes in again, so the reader keeps their bearings.
 */
export function flight(a: Camera, b: Camera, v: View): { duration: number; at: (t: number) => Camera } {
  const qa = viewCentre(a, v);
  const qb = viewCentre(b, v);
  const dr = ((normalise(b.r - a.r) + 180) % 360) - 180;
  const travel = Math.hypot(qb[0] - qa[0], qb[1] - qa[1]) * fitOf(v) * Math.min(a.k, b.k);
  const dip = Math.min(0.6, Math.max(0, (travel - 120) / 800) + Math.abs(dr) / 900);
  const la = Math.log(a.k);
  const lb = Math.log(b.k);
  const duration = Math.round(620 + Math.min(900, travel * 0.6 + Math.abs(dr) * 2.2 + Math.abs(lb - la) * 260));
  return {
    duration,
    at(t) {
      if (t >= 1) return b;
      const e = easeInOut(Math.max(0, t));
      const k = Math.exp(la + (lb - la) * e - dip * Math.sin(Math.PI * e));
      const r = a.r + dr * e;
      const q: Point = [qa[0] + (qb[0] - qa[0]) * e, qa[1] + (qb[1] - qa[1]) * e];
      // The camera that puts tree point q at the stage centre.
      const s = fitOf(v) * k;
      const [dx, dy] = rot([(q[0] - C[0]) * s, (q[1] - C[1]) * s], r);
      return { k, r, x: -dx, y: -dy };
    },
  };
}
