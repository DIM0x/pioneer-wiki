import { describe, expect, it } from "vitest";
import type { FriendLink } from "@/lib/model/types";
import { BASE, blankCount, chart, chartingOrder, claimOrder, claims, partition, realm, seats } from "@/lib/links/chart";
import { links } from "@/mock/community";

const friend = (i: number): FriendLink => ({
  id: `l-test-${String(i).padStart(3, "0")}`,
  name: { zh: `测试站点 ${i}`, en: `Test site ${i}` },
  url: `https://example.org/${i}`,
  description: { zh: "测试", en: "Test" },
  emblem: "geo-globe",
  since: `2027-01-${String((i % 28) + 1).padStart(2, "0")}`,
});

describe("links map", () => {
  it("traces a real coast with water lines, rivers and relief", () => {
    const r = realm();
    expect(r.rings[0].length).toBeGreaterThan(1000);
    expect(r.water).toHaveLength(5);
    expect(r.water.every((d) => d.startsWith("M"))).toBe(true);
    expect(r.rivers.length).toBeGreaterThan(5);
    expect(r.hills.length).toBeGreaterThan(20);
  });

  it("seats never move as more are added", () => {
    const first = seats(BASE);
    expect(seats(BASE + 10).slice(0, BASE)).toEqual(first);
    expect(new Set(seats(BASE + 10)).size).toBe(BASE + 10);
  });

  it("claims blank territories nearest the capital first, then splits", () => {
    const order = claimOrder();
    expect(order).toHaveLength(BASE - 1);
    expect(claims(3).held).toEqual(order.slice(0, 3));
    expect(claims(3).next).toBe(order[3]);
    expect(blankCount(3)).toBe(BASE - 4);
    const many = claims(BASE + 4);
    expect(many.seats).toBe(BASE + 5);
    expect(many.next).toBeNull();
    expect(new Set(many.held).size).toBe(BASE + 4);
    expect(blankCount(BASE + 4)).toBe(0);
  });

  it("divides all the land, and a new seat only takes ground", () => {
    const base = partition(BASE);
    const more = partition(BASE + 1);
    expect(base.every((t) => t.cells > 0 && t.path.startsWith("M"))).toBe(true);
    const land = realm().land.reduce((s, v) => s + v, 0);
    expect(base.reduce((s, t) => s + t.cells, 0)).toBeLessThanOrEqual(land);
    expect(base.reduce((s, t) => s + t.cells, 0)).toBeGreaterThan(land * 0.97);
    for (let k = 0; k < BASE; k++) expect(more[k].cells).toBeLessThanOrEqual(base[k].cells);
  });

  it("keeps the sheet the same size however many friends there are", () => {
    const few = chart(links, "wide", "zh");
    for (const count of [BASE - 1, 26, 66, 120])
      for (const shape of ["wide", "tall"] as const) {
        const crowd = chart(
          Array.from({ length: count }, (_, i) => friend(i)),
          shape,
          "zh",
        );
        expect(crowd.size).toEqual(shape === "wide" ? few.size : chart(links, "tall", "zh").size);
        expect(crowd.places.filter((p) => p.link)).toHaveLength(count);
        expect(crowd.places.filter((p) => p.link).every((p) => p.label)).toBe(true);
        expect(crowd.places.some((p) => p.kind === "blank" || p.kind === "next")).toBe(false);
      }
  });

  it("charts friends in the order they became neighbours, keeping earlier territories", () => {
    const ordered = chartingOrder(links);
    const before = chart(links, "wide", "en");
    const after = chart([...links, friend(1)], "wide", "en");
    for (const l of ordered) {
      const a = before.places.find((p) => p.link?.id === l.id)!;
      const b = after.places.find((p) => p.link?.id === l.id)!;
      expect(b.seat).toBe(a.seat);
    }
    // The newcomer takes the territory that was waiting for it.
    const waiting = before.places.find((p) => p.kind === "next")!;
    expect(after.places.find((p) => p.link?.id === friend(1).id)!.seat).toBe(waiting.seat);
  });

  it("labels every charted territory on both sheets, and keeps the type off the hills", () => {
    for (const shape of ["wide", "tall"] as const) {
      const c = chart(links, shape, "zh");
      const charted = c.places.filter((p) => p.kind === "charted");
      expect(charted).toHaveLength(links.length);
      expect(charted.every((p) => p.label && p.label.lines.length > 0)).toBe(true);
      expect(c.places.filter((p) => p.kind === "home")).toHaveLength(1);
      expect(c.hills.length).toBeGreaterThan(10);
      expect(c.title.x0).toBeGreaterThanOrEqual(0);
    }
  });

  it("is deterministic", () => {
    expect(JSON.stringify(chart(links, "tall", "en"))).toBe(JSON.stringify(chart(links, "tall", "en")));
  });
});
