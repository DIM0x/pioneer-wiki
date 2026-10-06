import { realm } from "./chart";

/*
 * The base of the Links map — water lines, the land, its sands and rivers —
 * is the same for every reader and every link list, and it is the heaviest
 * part of the drawing, so it is served once as a static SVG
 * (app/(entrance)/links/realm.svg) and placed on both sheets with an external
 * <use>. Selectors of the page never reach into it, so each element carries
 * its own style; colours and line weights come from custom properties the
 * <use> inherits from the page (--sea-ink, --chart-land, --weight, the ink
 * tokens).
 */

const WATER_STYLE = [
  [0.8, 0.75],
  [0.7, 0.56],
  [0.6, 0.42],
  [0.55, 0.3],
  [0.5, 0.2],
];

let memo: { svg: string; version: string } | null = null;

export function realmSvg(): { svg: string; version: string } {
  if (memo) return memo;
  const r = realm();
  const water = r.water
    .map(
      (d, i) =>
        `<path d="${d}" style="fill:none;stroke:var(--sea-ink);stroke-linejoin:round;stroke-width:calc(${WATER_STYLE[i][0]}px * var(--weight, 1));stroke-opacity:${WATER_STYLE[i][1]}"/>`,
    )
    .join("");
  const rivers = r.rivers
    .map(
      (d) =>
        `<path d="${d}" style="fill:none;stroke:var(--sea-ink);stroke-width:calc(0.9px * var(--weight, 1));stroke-linecap:round;stroke-linejoin:round"/>`,
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg"><defs><g id="pw-realm-base">${water}` +
    `<path d="${r.coast}" style="fill:var(--chart-land)"/>` +
    `<path d="${r.sand}" style="fill:none;stroke:var(--color-ink-3);stroke-width:calc(0.75px * var(--weight, 1));stroke-linecap:round;stroke-opacity:0.75"/>` +
    `${rivers}</g></defs></svg>\n`;
  let h = 2166136261;
  for (let i = 0; i < svg.length; i++) h = Math.imul(h ^ svg.charCodeAt(i), 16777619);
  memo = { svg, version: (h >>> 0).toString(36) };
  return memo;
}
