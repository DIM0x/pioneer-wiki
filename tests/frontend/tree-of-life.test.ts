import { describe, expect, it } from "vitest";
import {
  BAND_RESERVE,
  DEFAULT_VIEW,
  HOME,
  ZOOM,
  fitOf,
  flight,
  focusCamera,
  labelCap,
  rotateAbout,
  stageToTree,
  treeToStage,
  zoomAbout,
  type Camera,
  type Point,
  type View,
} from "@/lib/taxonomy/camera";
import { emWidth, fitText, onLowerHalf, radialLabel } from "@/lib/taxonomy/labels";
import { TREE, buildTree, bundlePath, polar, routeBetween } from "@/lib/taxonomy/tree";
import { categories, families } from "@/mock/taxonomy";
import { entries, relations } from "@/mock/entries";

const near = (a: Point, b: Point, digits = 6) => {
  expect(a[0]).toBeCloseTo(b[0], digits);
  expect(a[1]).toBeCloseTo(b[1], digits);
};
const view: View = { width: 1180, height: 780 };
const centre: Point = [view.width / 2, view.height / 2];

describe("tree of life layout", () => {
  const published = entries.filter((e) => e.status === "published");
  const tree = buildTree({ families, categories, entries: published, relations });

  it("draws every family and genus, and each published species once", () => {
    expect(tree.families).toHaveLength(7);
    expect(tree.genera).toHaveLength(45);
    expect(tree.leaves.map((l) => l.slug).sort()).toEqual(published.map((e) => e.slug).sort());
    expect(
      tree.genera
        .filter((g) => !g.empty)
        .map((g) => g.id)
        .sort(),
    ).toEqual([...new Set(published.map((e) => e.categoryId))].sort());
  });

  it("keeps families in catalogue order around the ring, each genus inside its family's span", () => {
    const angles = tree.families.map((f) => f.angle);
    expect([...angles].sort((a, b) => a - b)).toEqual(angles);
    for (const g of tree.genera) {
      const f = tree.families.find((x) => x.id === g.familyId)!;
      expect(g.angle).toBeGreaterThanOrEqual(f.start - 1e-9);
      expect(g.angle).toBeLessThanOrEqual(f.end + 1e-9);
    }
  });

  it("only draws relations between drawn species, routed through their common ancestor", () => {
    const drawn = new Set(tree.leaves.map((l) => l.entryId));
    for (const e of tree.edges) expect(drawn.has(e.from) && drawn.has(e.to)).toBe(true);
    const raft = tree.leaves.find((l) => l.slug === "raft-consensus")!;
    const paxos = tree.leaves.find((l) => l.slug === "paxos")!;
    const btree = tree.leaves.find((l) => l.slug === "b-tree")!;
    expect(routeBetween(tree, raft, paxos)).toHaveLength(3); // same genus: leaf, genus, leaf
    expect(routeBetween(tree, raft, btree).some(([, r]) => r === 0)).toBe(true); // other family: through the root
    expect(bundlePath(routeBetween(tree, raft, btree))).toMatch(/^M[\d.]+ [\d.]+L.*C.*L[\d.]+ [\d.]+$/);
  });
});

describe("tree labels", () => {
  it("reads upright on both halves of the ring", () => {
    expect(radialLabel(45)).toEqual({ rotate: -45, anchor: "start" });
    expect(radialLabel(90)).toEqual({ rotate: 0, anchor: "start" }); // three o'clock: level, reading outwards
    expect(radialLabel(270)).toEqual({ rotate: 0, anchor: "end" }); // nine o'clock: level, reading inwards
    expect(radialLabel(225).anchor).toBe("end");
    for (const t of [10, 100, 190, 280, 350]) expect(Math.abs(radialLabel(t).rotate)).toBeLessThanOrEqual(90);
    expect(onLowerHalf(180)).toBe(true);
    expect(onLowerHalf(0)).toBe(false);
  });

  it("fits a title to its room: cut at the colon, then ellipsised", () => {
    expect(fitText("大语言模型如何生成：Token、上下文与采样", 20)).toBe("大语言模型如何生成");
    const cut = fitText("大语言模型如何生成：Token、上下文与采样", 5);
    expect(cut.endsWith("…")).toBe(true);
    expect(emWidth(cut)).toBeLessThanOrEqual(5);
    expect(fitText("Raft consensus", 20)).toBe("Raft consensus");
    expect(fitText("流言协议", 0.5)).toBe("");
  });
});

describe("tree camera", () => {
  const cams: Camera[] = [HOME, { x: 120, y: -80, k: 2.3, r: 37 }, { x: -300, y: 40, k: 0.8, r: -210 }];

  it("fits the leaf ring and its label bands inside the shorter side at zoom 1", () => {
    for (const v of [view, DEFAULT_VIEW, { width: 760, height: 1100 }]) {
      expect(TREE.radius.leaf * fitOf(v) + BAND_RESERVE).toBeLessThanOrEqual(Math.min(v.width, v.height) / 2 + 1e-9);
    }
    expect(labelCap(1)).toBeLessThan(labelCap(4));
    expect(labelCap(100)).toBe(labelCap(4));
  });

  it("maps tree and stage points both ways", () => {
    for (const c of cams) near(stageToTree(c, treeToStage(c, [313, 702], view), view), [313, 702]);
    near(treeToStage(HOME, [TREE.centre, TREE.centre], view), centre);
  });

  it("zooms about the pointer without moving the point under it", () => {
    const c: Camera = { x: 40, y: 10, k: 1.4, r: 25 };
    const p: Point = [900, 300];
    const under = stageToTree(c, p, view);
    near(treeToStage(zoomAbout(c, p, 1.8, view), under, view), p);
    expect(zoomAbout(c, p, 1000, view).k).toBe(ZOOM.max);
    expect(zoomAbout(c, p, 0.0001, view).k).toBe(ZOOM.min);
  });

  it("rotates about a point without moving it", () => {
    const c: Camera = { x: -20, y: 60, k: 2, r: 10 };
    const p: Point = [500, 600];
    const under = stageToTree(c, p, view);
    near(treeToStage(rotateAbout(c, 33, view, p), under, view), p);
  });

  it("brings a species to three o'clock, level, at the anchor", () => {
    const anchor: Point = [420, 390];
    const c = focusCamera(200, TREE.radius.leaf, 3, anchor, HOME, view);
    near(treeToStage(c, polar(200, TREE.radius.leaf), view), anchor);
    expect((((c.r + 200) % 360) + 360) % 360).toBeCloseTo(90);
    expect(radialLabel(200 + c.r).rotate).toBeCloseTo(0);
  });

  it("flies from one view to another, pulling back on a long flight and landing exactly", () => {
    const b = focusCamera(300, TREE.radius.leaf, 3.5, [420, 390], HOME, view);
    const f = flight(HOME, b, view);
    expect(f.duration).toBeGreaterThan(600);
    expect(f.at(0)).toMatchObject({ k: HOME.k, r: HOME.r });
    expect(f.at(1)).toEqual(b);
    expect(f.at(0.5).k).toBeLessThan(Math.exp((Math.log(HOME.k) + Math.log(b.k)) / 2));
  });
});
