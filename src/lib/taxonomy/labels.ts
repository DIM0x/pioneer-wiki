/*
 * Type for the tree of life: rough advance widths, and the orientation rules
 * that keep every label upright. Widths are estimated, not measured, so labels
 * can be placed without touching the DOM; the faces are Newsreader and Noto
 * Serif SC, and widths are in ems.
 */

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;

/** Approximate advance width of `text` in ems; errs wide, so a label never runs past its room. */
export function emWidth(text: string, italic = false): number {
  let w = 0;
  for (const ch of text) {
    if (CJK.test(ch)) w += 1;
    else if (ch === " ") w += 0.28;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else if (/[a-z0-9]/.test(ch)) w += 0.52;
    else w += 0.45;
  }
  return italic ? w * 0.95 : w;
}

/**
 * Fit `text` into `maxEm`: a technical title is first cut at its colon
 * ("大语言模型如何生成：Token、上下文与采样" → "大语言模型如何生成"), then
 * ellipsised. Returns "" when not even one character and the ellipsis fit.
 */
export function fitText(text: string, maxEm: number, italic = false): string {
  const head = text.split(/[：:—–]/)[0].trim() || text.trim();
  if (emWidth(head, italic) <= maxEm) return head;
  let out = "";
  for (const ch of head) {
    if (emWidth(`${out}${ch}…`, italic) > maxEm) break;
    out += ch;
  }
  return out ? `${out.trimEnd()}…` : "";
}

/**
 * A radial label at screen angle `turned` (degrees, 0 = up, clockwise): it
 * reads outwards on the right half and inwards on the left, so it is never
 * upside down. `rotate` is the SVG rotation for text starting at its anchor.
 */
export function radialLabel(turned: number): { rotate: number; anchor: "start" | "end" } {
  const t = ((turned % 360) + 360) % 360;
  const right = t <= 180;
  return { rotate: right ? t - 90 : t - 270, anchor: right ? "start" : "end" };
}

/** Unit vector at screen angle `turned` (0 = up, clockwise). */
export function direction(turned: number): [number, number] {
  const a = (turned * Math.PI) / 180;
  return [Math.sin(a), -Math.cos(a)];
}

/**
 * An arc of radius `r` about `centre` from screen angle a0 to a1 (0 = up,
 * clockwise). `reverse` runs it the other way, which is how text along the
 * lower half of a ring stays right way up.
 */
export function ringArc(centre: [number, number], r: number, a0: number, a1: number, reverse = false): string {
  const at = (a: number) => {
    const [dx, dy] = direction(a);
    return `${Math.round((centre[0] + r * dx) * 100) / 100} ${Math.round((centre[1] + r * dy) * 100) / 100}`;
  };
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const rr = Math.round(r * 100) / 100;
  return reverse ? `M${at(a1)}A${rr} ${rr} 0 ${large} 0 ${at(a0)}` : `M${at(a0)}A${rr} ${rr} 0 ${large} 1 ${at(a1)}`;
}

/** Whether a screen angle is on the lower half of the ring, where text along it must run backwards. */
export const onLowerHalf = (turned: number) => {
  const t = ((turned % 360) + 360) % 360;
  return t > 90 && t < 270;
};
