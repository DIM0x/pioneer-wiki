"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Lang, RelationKind } from "@/lib/model/types";
import { RELATION_KIND_IDS, RELATION_KINDS } from "@/lib/model/vocab";
import { TREE, branchPath, bundlePath, normalise, polar, type TreeLayout } from "@/lib/taxonomy/tree";
import {
  ARC_GAP,
  BAND_DEPTH,
  DEFAULT_VIEW,
  HOME,
  LABEL_GAP,
  TYPE,
  cameraTransform,
  clampZoom,
  fitOf,
  flight,
  focusCamera,
  labelCap,
  pan,
  rotateAbout,
  treeToStage,
  zoomAbout,
  type Camera,
  type Point,
  type View,
} from "@/lib/taxonomy/camera";
import { direction, emWidth, fitRimLabels, fitText, onLowerHalf, radialLabel, ringArc } from "@/lib/taxonomy/labels";
import { cn } from "@/lib/utils";

/*
 * 生命之树 — the catalogue as a radial systema the reader can travel through.
 *
 * The engraving (boughs, relation bundles) lives in tree coordinates under one
 * camera transform: drag to pan, wheel or pinch to zoom, Shift-wheel, a
 * two-finger twist or the dial to turn. The stage is the SVG's own size in
 * CSS pixels, so nodes and type are set at their true size whatever the zoom
 * and always read upright.
 *
 * Type never crosses the family arcs: each species label is fitted to a
 * measured room, and the arcs sit just outside the longest one; genus names
 * give way where they would collide and come back as the reader zooms in.
 * Choosing a family, a genus or a species flies the camera there and opens
 * its card; the rest of the tree sinks into the paper.
 */

const R = TREE.radius;
type Focus = { kind: "leaf" | "genus" | "family"; id: string } | null;

const EDGE: Record<RelationKind, { className: string; dash?: string }> = {
  symbiosis: { className: "text-moss" },
  source: { className: "text-indigo" },
  taxonomy: { className: "text-ink" },
  contrast: { className: "text-ink-3", dash: "6 5" },
  dependency: { className: "text-indigo", dash: "1.5 4" },
  dispute: { className: "text-brick", dash: "8 4 1.5 4" },
};

/** A band of paper under a label, as on an engraved map, so lines passing behind it never cut the letters. */
const HALO = {
  paintOrder: "stroke",
  stroke: "var(--color-paper-sheet)",
  strokeWidth: 4,
  strokeLinejoin: "round",
} as const;

/** Stage coordinates are rounded so the server and the browser print the same digits. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Room a label needs across the ring (its line height), in pixels. */
const LEAF_LINE = TYPE.leaf * 1.25;

export function TreeOfLife({ tree, lang, title }: { tree: TreeLayout; lang: Lang; title: string }) {
  const zh = lang === "zh";
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef<View>(DEFAULT_VIEW);
  const [cam, setCam] = useState<Camera>(HOME);
  const camRef = useRef<Camera>(HOME);
  const [hover, setHover] = useState<Focus>(null);
  const [chosen, setChosen] = useState<Focus>(null);
  const [kinds, setKinds] = useState<Set<RelationKind>>(() => new Set(RELATION_KIND_IDS));
  const [showRefs, setShowRefs] = useState(true);
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const flightRef = useRef(0);
  const active = hover ?? chosen;

  const leafById = useMemo(() => new Map(tree.leaves.map((l) => [l.entryId, l])), [tree.leaves]);
  const genusById = useMemo(() => new Map(tree.genera.map((g) => [g.id, g])), [tree.genera]);
  const familyById = useMemo(() => new Map(tree.families.map((f) => [f.id, f])), [tree.families]);

  // The stage is measured in CSS pixels, so type on it is set at its true size.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const width = Math.round(box.clientWidth);
      const height = Math.round(Math.min(Math.max(520, width * 0.68), window.innerHeight * 0.86));
      if (width && (width !== viewRef.current.width || height !== viewRef.current.height)) {
        viewRef.current = { width, height };
        setView({ width, height });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // ── Camera ───────────────────────────────────────────────────────────────

  const place = useCallback((next: Camera) => {
    camRef.current = next;
    setCam(next);
  }, []);
  const stopFlight = () => cancelAnimationFrame(flightRef.current);

  /** Fly to `target`; with reduced motion, cut. */
  const fly = useCallback(
    (target: Camera) => {
      cancelAnimationFrame(flightRef.current);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return place(target);
      const plan = flight(camRef.current, target, viewRef.current);
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / plan.duration);
        place(plan.at(t));
        if (t < 1) flightRef.current = requestAnimationFrame(step);
      };
      flightRef.current = requestAnimationFrame(step);
    },
    [place],
  );
  useEffect(() => () => cancelAnimationFrame(flightRef.current), []);

  const toStage = (event: { clientX: number; clientY: number }): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  const middle = (): Point => [viewRef.current.width / 2, viewRef.current.height / 2];

  // Wheel zooms about the pointer, Shift-wheel turns. Non-passive, so the page does not scroll under the tree.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cancelAnimationFrame(flightRef.current);
      const rect = svg.getBoundingClientRect();
      const p: Point = [event.clientX - rect.left, event.clientY - rect.top];
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (event.shiftKey) place(rotateAbout(camRef.current, delta * 0.12, viewRef.current, p));
      else place(zoomAbout(camRef.current, p, Math.exp(-delta * 0.0016), viewRef.current));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [place]);

  // One pointer drags; two pinch and twist.
  const pointers = useRef(new Map<number, Point>());
  const travelled = useRef(0);
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopFlight();
    pointers.current.set(event.pointerId, toStage(event));
    travelled.current = 0;
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const last = pointers.current.get(event.pointerId);
    if (!last) return;
    const now = toStage(event);
    if (pointers.current.size === 1) {
      travelled.current += Math.hypot(now[0] - last[0], now[1] - last[1]);
      if (travelled.current > 6) {
        if (!dragging) {
          setDragging(true);
          svgRef.current?.setPointerCapture(event.pointerId);
        }
        place(pan(camRef.current, now[0] - last[0], now[1] - last[1]));
      }
    } else if (pointers.current.size === 2) {
      const otherId = [...pointers.current.keys()].find((id) => id !== event.pointerId)!;
      const other = pointers.current.get(otherId)!;
      const before = Math.hypot(last[0] - other[0], last[1] - other[1]);
      const after = Math.hypot(now[0] - other[0], now[1] - other[1]);
      const twist =
        ((Math.atan2(now[1] - other[1], now[0] - other[0]) - Math.atan2(last[1] - other[1], last[0] - other[0])) *
          180) /
        Math.PI;
      const mid: Point = [(now[0] + other[0]) / 2, (now[1] + other[1]) / 2];
      travelled.current += 20;
      setDragging(true);
      const zoomed = zoomAbout(camRef.current, mid, before ? after / before : 1, viewRef.current);
      place(rotateAbout(zoomed, ((twist + 540) % 360) - 180, viewRef.current, mid));
    }
    pointers.current.set(event.pointerId, now);
  };
  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) setDragging(false);
  };
  /** The click that ends a drag must not also choose what it lands on. */
  const swallowClickAfterDrag = (event: React.MouseEvent) => {
    if (travelled.current > 6) {
      event.preventDefault();
      event.stopPropagation();
      travelled.current = 0;
    }
  };

  // ── Choosing and flying ──────────────────────────────────────────────────

  /** Where a chosen subject is brought: left of centre, leaving the right for its card. */
  const anchor = (): Point => {
    const v = viewRef.current;
    return [v.width >= 820 ? v.width * 0.36 : v.width * 0.3, v.height * 0.5];
  };

  const choose = useCallback(
    (next: Focus) => {
      setChosen(next);
      const v = viewRef.current;
      if (!next) return fly(HOME);
      const a = anchor();
      if (next.kind === "leaf") {
        const l = leafById.get(next.id);
        if (l) fly(focusCamera(l.angle, R.leaf, 2.8, a, camRef.current, v));
      } else if (next.kind === "genus") {
        const g = genusById.get(next.id);
        if (g) fly(focusCamera(g.angle, (R.genus + R.leaf) / 2, 2.2, a, camRef.current, v));
      } else {
        const f = familyById.get(next.id);
        if (f) {
          const span = Math.max(24, f.end - f.start);
          let k = clampZoom(1.2 * Math.min(2.1, 120 / span));
          // The band reaches this far right of the anchor; keep it left of the card (21rem + margins).
          const reach = (kk: number) =>
            (R.leaf - R.genus) * fitOf(v) * kk + LABEL_GAP + labelCap(kk) + ARC_GAP + BAND_DEPTH;
          const limit = v.width >= 820 ? v.width - 370 - a[0] : v.width - a[0] - 12;
          while (k > 1 && reach(k) > limit) k *= 0.94;
          fly(focusCamera(f.angle, R.genus, Math.max(1, k), a, camRef.current, v));
        }
      }
    },
    [familyById, fly, genusById, leafById],
  );

  // Keyboard on the stage: arrows pan, + / − zoom, [ ] turn, 0 or Escape shows the whole tree.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget) {
      if (event.key === "Escape") choose(null);
      return;
    }
    const c = camRef.current;
    const v = viewRef.current;
    const moves: Record<string, () => Camera> = {
      ArrowLeft: () => pan(c, 80, 0),
      ArrowRight: () => pan(c, -80, 0),
      ArrowUp: () => pan(c, 0, 80),
      ArrowDown: () => pan(c, 0, -80),
      "+": () => zoomAbout(c, middle(), 1.3, v),
      "=": () => zoomAbout(c, middle(), 1.3, v),
      "-": () => zoomAbout(c, middle(), 1 / 1.3, v),
      "[": () => rotateAbout(c, -15, v),
      "]": () => rotateAbout(c, 15, v),
    };
    if (event.key === "0" || event.key === "Escape") {
      event.preventDefault();
      return choose(null);
    }
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      fly(move());
    }
  };

  // ── What is lit ──────────────────────────────────────────────────────────

  const lit = useMemo(() => {
    if (!active) return null;
    const leaves = new Set<string>();
    const genera = new Set<string>();
    const families = new Set<string>();
    const edges = new Set<string>();
    const refs = new Set<string>();
    const addLeaf = (id: string) => {
      const l = leafById.get(id);
      if (!l) return;
      leaves.add(id);
      genera.add(l.genusId);
      families.add(l.familyId);
    };
    if (active.kind === "leaf") {
      addLeaf(active.id);
      for (const e of tree.edges)
        if (kinds.has(e.kind) && (e.from === active.id || e.to === active.id)) {
          edges.add(e.id);
          addLeaf(e.from === active.id ? e.to : e.from);
        }
      if (showRefs)
        for (const r of tree.references)
          if (r.entryId === active.id) {
            refs.add(r.id);
            genera.add(r.genusId);
            families.add(genusById.get(r.genusId)!.familyId);
          }
    } else if (active.kind === "genus") {
      const g = genusById.get(active.id)!;
      genera.add(g.id);
      families.add(g.familyId);
      for (const l of tree.leaves) if (l.genusId === g.id) addLeaf(l.entryId);
      if (showRefs)
        for (const r of tree.references)
          if (r.genusId === g.id) {
            refs.add(r.id);
            addLeaf(r.entryId);
          }
      for (const e of tree.edges) if (kinds.has(e.kind) && (leaves.has(e.from) || leaves.has(e.to))) edges.add(e.id);
    } else {
      families.add(active.id);
      for (const g of tree.genera) if (g.familyId === active.id) genera.add(g.id);
      for (const l of tree.leaves) if (l.familyId === active.id) addLeaf(l.entryId);
      for (const e of tree.edges) if (kinds.has(e.kind) && (leaves.has(e.from) || leaves.has(e.to))) edges.add(e.id);
    }
    return { leaves, genera, families, edges, refs };
  }, [active, genusById, kinds, leafById, showRefs, tree.edges, tree.genera, tree.leaves, tree.references]);
  const dim = (on: boolean) => (lit && !on ? "opacity-[0.12]" : "opacity-100");

  // ── Type, placed on the stage ────────────────────────────────────────────

  const unit = fitOf(view) * cam.k; // stage pixels per tree unit
  const stage = (q: Point): Point => {
    const [x, y] = treeToStage(cam, q, view);
    return [r2(x), r2(y)];
  };
  const root = stage([TREE.centre, TREE.centre]);
  const leafR = R.leaf * unit;
  const genusR = R.genus * unit;
  const cap = labelCap(cam.k);
  const onStage = ([x, y]: Point, margin = 60) =>
    x > -margin && x < view.width + margin && y > -margin && y < view.height + margin;
  /** Screen angle of a tree angle under the current turn. */
  const turned = (angle: number) => angle + cam.r;

  /*
   * Species labels. Every species' label is fitted once, whether or not it is
   * shown, and the family arcs are placed outside the longest of them. The arc
   * radius therefore never depends on what the pointer is over: lighting a
   * species can reveal a label but cannot move an arc under the pointer, which
   * would change what is hovered and set the page flickering.
   */
  const fittedLabels = useMemo(
    () => fitRimLabels(tree.leaves, lang, cap, { leaf: TYPE.leaf, latin: TYPE.leafLatin }, cam.k > 1.25),
    [cam.k, cap, lang, tree.leaves],
  );
  /** Species with a line's room between their neighbours show their label at rest; the others only when lit. */
  const roomy = useMemo(() => {
    const sorted = [...tree.leaves].sort((a, b) => a.angle - b.angle);
    const out = new Set<string>();
    sorted.forEach((l, i) => {
      const prev = sorted[(i - 1 + sorted.length) % sorted.length];
      const next = sorted[(i + 1) % sorted.length];
      const gap = sorted.length > 1 ? Math.min(normalise(l.angle - prev.angle), normalise(next.angle - l.angle)) : 360;
      if (((gap * Math.PI) / 180) * leafR >= LEAF_LINE * 0.9) out.add(l.entryId);
    });
    return out;
  }, [leafR, tree.leaves]);
  const leafLabel = (id: string) =>
    roomy.has(id) || (lit?.leaves.has(id) ?? false) ? fittedLabels.get(id) : undefined;
  const longestLabel = Math.max(0, ...[...fittedLabels.values()].map((l) => l.width));
  /** The family arcs sit just outside the longest species label: nothing crosses them. */
  const arcR = leafR + LABEL_GAP + Math.max(longestLabel, 24) + ARC_GAP;

  /*
   * Genus names: Latin, set radially in the band between the genus ring and the
   * leaf ring, a little to the side of the node so they run beside the branch
   * rather than on it. A name shows only when its neighbours leave a line's
   * room, and is fitted to the band's depth; the rest appear as the reader zooms.
   */
  const genusLabels = useMemo(() => {
    const out = new Map<string, string>();
    const depth = leafR - genusR - 20;
    if (depth < 46) return out;
    const sorted = [...tree.genera].sort((a, b) => a.angle - b.angle);
    const px = (deg: number) => ((deg * Math.PI) / 180) * genusR;
    sorted.forEach((g, i) => {
      const prev = sorted[(i - 1 + sorted.length) % sorted.length];
      const next = sorted[(i + 1) % sorted.length];
      const gap = Math.min(normalise(g.angle - prev.angle), normalise(next.angle - g.angle));
      if (px(gap) < TYPE.genus * 1.5) return;
      const text = fitText(g.scientificName, depth / TYPE.genus, true);
      if (text && !(text.endsWith("…") && text.length < 5)) out.set(g.id, text);
    });
    return out;
  }, [genusR, leafR, tree.genera]);

  const focusLeaf = chosen?.kind === "leaf" ? leafById.get(chosen.id) : undefined;
  const focusGenus = chosen?.kind === "genus" ? genusById.get(chosen.id) : undefined;
  const focusFamily = chosen?.kind === "family" ? familyById.get(chosen.id) : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* ── The families, as tabs to fly to ── */}
      <nav aria-label={zh ? "飞到大类" : "Fly to a family"} className="flex flex-wrap gap-x-5 gap-y-1.5">
        {tree.families.map((f) => (
          <button
            key={f.id}
            type="button"
            data-phylum={f.id}
            onClick={() => choose({ kind: "family", id: f.id })}
            aria-pressed={chosen?.kind === "family" && chosen.id === f.id}
            className={cn(
              "flex items-baseline gap-1.5 border-b py-0.5 text-small transition-colors duration-(--dur-quick)",
              chosen?.kind === "family" && chosen.id === f.id
                ? "border-phylum text-ink"
                : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            <span className="font-display text-phylum italic">{f.numeral}</span>
            {f.name[lang]}
          </button>
        ))}
      </nav>

      <div ref={boxRef} className="relative overflow-hidden rounded-xs border border-rule bg-paper-sheet/40">
        <svg
          ref={svgRef}
          width={view.width}
          height={view.height}
          viewBox={`0 0 ${view.width} ${view.height}`}
          role="application"
          aria-roledescription={zh ? "可缩放的生命之树" : "zoomable tree of life"}
          aria-label={`${title}. ${
            zh
              ? "方向键平移，+ 和 − 缩放，[ 和 ] 旋转，0 回到全貌，Tab 逐个经过科、属与物种。"
              : "Arrows pan, + and − zoom, [ and ] turn, 0 shows the whole tree, Tab walks through families, genera and species."
          }`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => setHover(null)}
          onClickCapture={swallowClickAfterDrag}
          className={cn(
            "block max-w-full touch-none select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <defs>
            <marker
              id="tol-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0.8 7 4 0 7.2" fill="none" stroke="currentColor" strokeWidth="1" />
            </marker>
            <radialGradient id="tol-ground" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-paper-sheet)" stopOpacity="0.75" />
              <stop offset="80%" stopColor="var(--color-paper-sheet)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-paper-sheet)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Clicking bare paper lets go of the focus. */}
          <rect width={view.width} height={view.height} fill="transparent" onClick={() => chosen && choose(null)} />
          <circle cx={root[0]} cy={root[1]} r={r2(arcR + 30)} fill="url(#tol-ground)" className="pointer-events-none" />

          {/* ── The engraving, under the camera ── */}
          <g transform={cameraTransform(cam, view)} className="pw-hairline pointer-events-none">
            {[R.family, R.genus, R.leaf].map((r) => (
              <circle
                key={r}
                cx={TREE.centre}
                cy={TREE.centre}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="1 5"
                className="text-rule-strong"
              />
            ))}
            <g fill="none" stroke="currentColor" className="text-ink-2">
              {tree.families.map((f) => (
                <path
                  key={f.id}
                  d={branchPath([f.angle, 0], [f.angle, R.family])}
                  strokeWidth="1.8"
                  className={cn("transition-opacity duration-(--dur-base)", dim(!lit || lit.families.has(f.id)))}
                />
              ))}
              {tree.genera.map((g) => (
                <path
                  key={g.id}
                  d={branchPath([familyById.get(g.familyId)!.angle, R.family], [g.angle, R.genus])}
                  strokeWidth="1.1"
                  className={cn("transition-opacity duration-(--dur-base)", dim(!lit || lit.genera.has(g.id)))}
                />
              ))}
              {tree.leaves.map((l) => (
                <path
                  key={l.entryId}
                  d={branchPath([genusById.get(l.genusId)!.angle, R.genus], [l.angle, R.leaf])}
                  strokeWidth="0.8"
                  className={cn("transition-opacity duration-(--dur-base)", dim(!lit || lit.leaves.has(l.entryId)))}
                />
              ))}
              {/* An empty genus keeps a dotted stub: the branch waits for its first species. */}
              {tree.genera
                .filter((g) => g.empty)
                .map((g) => (
                  <path
                    key={`stub-${g.id}`}
                    d={branchPath([g.angle, R.genus], [g.angle, R.genus + 40])}
                    strokeWidth="0.7"
                    strokeDasharray="1.5 3"
                    className={cn(
                      "text-ink-3 transition-opacity duration-(--dur-base)",
                      dim(!lit || lit.genera.has(g.id)),
                    )}
                  />
                ))}
            </g>
            <g fill="none">
              {tree.edges
                .filter((e) => kinds.has(e.kind))
                .map((e) => {
                  const on = !lit || lit.edges.has(e.id);
                  return (
                    <path
                      key={e.id}
                      d={bundlePath(e.route)}
                      stroke="currentColor"
                      strokeWidth={(0.6 + e.strength * 0.45) * (lit && on ? 1.7 : 1)}
                      strokeDasharray={EDGE[e.kind].dash}
                      markerEnd={RELATION_KINDS[e.kind].symmetric ? undefined : "url(#tol-arrow)"}
                      className={cn(
                        EDGE[e.kind].className,
                        "transition-opacity duration-(--dur-base)",
                        lit ? (on ? "opacity-95" : "opacity-[0.05]") : "opacity-55",
                      )}
                    />
                  );
                })}
              {showRefs
                ? tree.references.map((r) => {
                    const on = !lit || lit.refs.has(r.id);
                    return (
                      <path
                        key={r.id}
                        data-phylum={genusById.get(r.genusId)?.familyId}
                        d={bundlePath(r.route)}
                        stroke="currentColor"
                        strokeWidth={lit && on ? 1.5 : 1.1}
                        strokeDasharray="0.1 3.6"
                        strokeLinecap="round"
                        className={cn(
                          "text-phylum-ink transition-opacity duration-(--dur-base)",
                          lit ? (on ? "opacity-90" : "opacity-[0.04]") : "opacity-35",
                        )}
                      />
                    );
                  })
                : null}
            </g>
          </g>

          {/* ── Family bands: an arc just outside the longest species label, its name outside the arc ── */}
          {tree.families.map((f, fi) => {
            const a0 = turned(f.start) - 2.2;
            const a1 = turned(f.end) + 2.2;
            const mid = (a0 + a1) / 2;
            const lower = onLowerHalf(mid);
            const on = !lit || lit.families.has(f.id);
            /*
             * The name may run past its own arc into the gaps on either side, up to
             * half-way to the neighbouring families; long names first set a little
             * smaller, and only then are shortened.
             */
            const prevF = tree.families[(fi - 1 + tree.families.length) % tree.families.length];
            const nextF = tree.families[(fi + 1) % tree.families.length];
            const roomDeg =
              f.end - f.start + normalise(f.start - prevF.end) / 2 + normalise(nextF.start - f.end) / 2 - 2;
            const roomPx = ((roomDeg * Math.PI) / 180) * (arcR + 14);
            const fullName = f.name[lang];
            const nameSize = Math.max(
              TYPE.family * 0.78,
              Math.min(TYPE.family, roomPx / Math.max(1, emWidth(fullName))),
            );
            const name = fitText(fullName, roomPx / nameSize);
            const latin = fitText(f.scientificName, roomPx / TYPE.familyLatin, true);
            const half =
              Math.min(roomDeg, ((Math.max(emWidth(name) * nameSize, 1) / (arcR + 14)) * 180) / Math.PI) / 2 + 2;
            const t0 = Math.min(a0, mid - half);
            const t1 = Math.max(a1, mid + half);
            // Text paths: on the lower half the path runs backwards and sits one line further out.
            const nameR = lower ? arcR + 7 + nameSize * 0.78 : arcR + 7 + TYPE.familyLatin + 5;
            const latinR = lower ? nameR + 5 + TYPE.familyLatin * 0.8 : arcR + 7;
            const select = () => choose({ kind: "family", id: f.id });
            const node = stage(polar(f.angle, R.family));
            return (
              <g key={f.id} data-phylum={f.id} className={cn("transition-opacity duration-(--dur-base)", dim(on))}>
                <path d={ringArc(root, arcR, a0, a1)} fill="none" stroke="var(--phylum)" strokeWidth="1.2" />
                <path id={`tol-n-${f.id}`} d={ringArc(root, nameR, t0, t1, lower)} fill="none" />
                <path id={`tol-l-${f.id}`} d={ringArc(root, latinR, t0, t1, lower)} fill="none" />
                <circle
                  cx={node[0]}
                  cy={node[1]}
                  r="11"
                  fill="var(--color-paper)"
                  stroke="var(--phylum)"
                  strokeWidth="1.3"
                />
                <text
                  x={node[0]}
                  y={node[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none fill-phylum-ink font-display text-[13px] italic"
                >
                  {f.numeral}
                </text>
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${f.numeral} ${f.name[lang]} · ${f.scientificName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    select();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select();
                    }
                  }}
                  onPointerEnter={() => setHover({ kind: "family", id: f.id })}
                  onPointerLeave={() => setHover(null)}
                  className="cursor-pointer focus:outline-none [&:focus-visible_text]:underline"
                >
                  {name ? (
                    <text className="fill-phylum-ink font-display" style={{ fontSize: r2(nameSize) }}>
                      <textPath href={`#tol-n-${f.id}`} startOffset="50%" textAnchor="middle">
                        {name}
                      </textPath>
                    </text>
                  ) : null}
                  {latin ? (
                    <text className="fill-ink-3 font-display italic" style={{ fontSize: TYPE.familyLatin }}>
                      <textPath href={`#tol-l-${f.id}`} startOffset="50%" textAnchor="middle">
                        {latin}
                      </textPath>
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}

          {/* ── Root ── */}
          <g aria-hidden="true">
            <circle cx={root[0]} cy={root[1]} r="5" className="fill-ink" />
            <circle
              cx={root[0]}
              cy={root[1]}
              r="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
              className="text-ink-3"
            />
          </g>

          {/* ── Genera ── */}
          {tree.genera.map((g) => {
            const p = stage(polar(g.angle, R.genus));
            if (!onStage(p)) return null;
            const on = !lit || lit.genera.has(g.id);
            const t = turned(g.angle);
            const label = genusLabels.get(g.id);
            const { rotate, anchor } = radialLabel(t);
            const [dx, dy] = direction(t);
            // Beside the branch: shifted half a line along the ring, clockwise.
            const [sx, sy] = direction(t + 90);
            const side = TYPE.genus * 0.62;
            return (
              <g
                key={g.id}
                data-phylum={g.familyId}
                className={cn("transition-opacity duration-(--dur-base)", dim(on))}
              >
                <Link
                  href={`/categories/${g.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    choose({ kind: "genus", id: g.id });
                  }}
                  onPointerEnter={() => setHover({ kind: "genus", id: g.id })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ kind: "genus", id: g.id })}
                  onBlur={() => setHover(null)}
                  aria-label={`${g.name[lang]} · ${g.scientificName}${g.empty ? (zh ? " · 待入藏" : " · awaiting accession") : ""}`}
                  className="group focus:outline-none"
                >
                  <circle cx={p[0]} cy={p[1]} r="14" fill="transparent" />
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={g.empty ? 4.2 : 5.2}
                    fill={g.empty ? "var(--color-paper)" : "var(--phylum)"}
                    stroke="var(--phylum)"
                    strokeWidth="1.2"
                    strokeDasharray={g.empty ? "1.6 1.6" : undefined}
                  />
                  {label ? (
                    <text
                      transform={`translate(${r2(p[0] + dx * 12 + sx * side)} ${r2(p[1] + dy * 12 + sy * side)}) rotate(${r2(rotate)})`}
                      textAnchor={anchor}
                      dominantBaseline="central"
                      className="fill-phylum-ink font-display italic group-hover:underline group-focus-visible:underline"
                      style={{ ...HALO, fontSize: TYPE.genus }}
                    >
                      {label}
                    </text>
                  ) : null}
                </Link>
              </g>
            );
          })}

          {/* ── Species at the rim ── */}
          {tree.leaves.map((l) => {
            const p = stage(polar(l.angle, R.leaf));
            if (!onStage(p)) return null;
            const on = !lit || lit.leaves.has(l.entryId);
            const isChosen = chosen?.kind === "leaf" && chosen.id === l.entryId;
            const t = turned(l.angle);
            const label = leafLabel(l.entryId);
            const { rotate, anchor } = radialLabel(t);
            const [dx, dy] = direction(t);
            return (
              <g
                key={l.entryId}
                data-phylum={l.familyId}
                className={cn("transition-opacity duration-(--dur-base)", dim(on))}
              >
                <Link
                  href={`/entries/${l.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    choose({ kind: "leaf", id: l.entryId });
                  }}
                  onPointerEnter={() => setHover({ kind: "leaf", id: l.entryId })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ kind: "leaf", id: l.entryId })}
                  onBlur={() => setHover(null)}
                  aria-label={`${l.title[lang]}${l.species ? ` · ${l.species}` : ""}`}
                  className="group focus:outline-none"
                >
                  <circle cx={p[0]} cy={p[1]} r="16" fill="transparent" />
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={isChosen ? 7 : 5}
                    className={
                      l.status === "published" ? "fill-ink" : l.status === "in_review" ? "fill-indigo" : "fill-gold"
                    }
                    stroke="var(--color-paper)"
                    strokeWidth="1.5"
                  />
                  {isChosen ? (
                    <circle cx={p[0]} cy={p[1]} r="12" fill="none" stroke="var(--phylum)" strokeWidth="1" />
                  ) : null}
                  {label ? (
                    <text
                      transform={`translate(${r2(p[0] + dx * LABEL_GAP)} ${r2(p[1] + dy * LABEL_GAP)}) rotate(${r2(rotate)})`}
                      textAnchor={anchor}
                      dominantBaseline="central"
                      className="fill-ink font-display group-hover:fill-[var(--phylum-ink)] group-focus-visible:underline"
                      style={{ ...HALO, fontSize: TYPE.leaf }}
                    >
                      {label.text}
                      {label.latin ? (
                        <tspan className="fill-ink-3 italic" dx="8" style={{ fontSize: TYPE.leafLatin }}>
                          {label.latin}
                        </tspan>
                      ) : null}
                    </text>
                  ) : null}
                </Link>
              </g>
            );
          })}
        </svg>

        {/* ── The card of whatever is chosen ── */}
        {chosen ? (
          <aside
            key={`${chosen.kind}:${chosen.id}`}
            data-phylum={focusLeaf?.familyId ?? focusGenus?.familyId ?? focusFamily?.id}
            className="pw-settle absolute top-4 right-4 max-h-[calc(100%-6rem)] w-[min(21rem,calc(100%-2rem))] overflow-y-auto rounded-xs border border-rule bg-paper-sheet/95 p-5 shadow-lifted backdrop-blur-[2px]"
          >
            <button
              type="button"
              onClick={() => choose(null)}
              aria-label={zh ? "关闭" : "Close"}
              className="absolute top-2 right-2 px-2 text-lead text-ink-3 hover:text-ink"
            >
              ×
            </button>
            {focusLeaf ? (
              <LeafCard tree={tree} leafId={focusLeaf.entryId} lang={lang} kinds={kinds} onChoose={choose} />
            ) : focusGenus ? (
              <GenusCard tree={tree} genusId={focusGenus.id} lang={lang} onChoose={choose} />
            ) : focusFamily ? (
              <FamilyCard tree={tree} familyId={focusFamily.id} lang={lang} onChoose={choose} />
            ) : null}
          </aside>
        ) : null}
      </div>

      {/* ── Instruments, beneath the plate ── */}
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend lang={lang} kinds={kinds} setKinds={setKinds} showRefs={showRefs} setShowRefs={setShowRefs} />
        <div className="flex items-center gap-1">
          <Dial
            rotation={cam.r}
            onTurn={(deg) => place(rotateAbout(camRef.current, deg, viewRef.current))}
            onStep={(deg) => fly(rotateAbout(camRef.current, deg, viewRef.current))}
            lang={lang}
          />
          <span aria-hidden="true" className="mx-1.5 h-6 w-px bg-rule" />
          <ToolButton
            label={zh ? "放大" : "Zoom in"}
            onClick={() => fly(zoomAbout(camRef.current, middle(), 1.5, viewRef.current))}
          >
            +
          </ToolButton>
          <span className="w-11 text-center font-mono text-meta text-ink-3 tabular-nums">
            {Math.round(cam.k * 100)}%
          </span>
          <ToolButton
            label={zh ? "缩小" : "Zoom out"}
            onClick={() => fly(zoomAbout(camRef.current, middle(), 1 / 1.5, viewRef.current))}
          >
            −
          </ToolButton>
          <span aria-hidden="true" className="mx-1.5 h-6 w-px bg-rule" />
          <button type="button" onClick={() => choose(null)} className="px-1.5 text-small text-ink-2 hover:text-ink">
            {zh ? "全貌" : "Whole tree"}
          </button>
        </div>
      </div>
      <p className="-mt-2 text-meta text-ink-3">
        {zh
          ? "拖动平移 · 滚轮缩放 · Shift + 滚轮、双指或罗盘旋转 · 点击科、属或物种飞过去 · 键盘：方向键、+ −、[ ]、0"
          : "Drag to pan · wheel to zoom · Shift-wheel, two fingers or the dial to turn · click a family, genus or species to fly there · keys: arrows, + −, [ ], 0"}
      </p>

      <p aria-live="polite" className="sr-only">
        {focusLeaf
          ? `${focusLeaf.title[lang]} ${focusLeaf.species ?? ""}`
          : focusGenus
            ? `${focusGenus.name[lang]} ${focusGenus.scientificName}`
            : focusFamily
              ? `${focusFamily.name[lang]} ${focusFamily.scientificName}`
              : ""}
      </p>
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────

function LeafCard({
  tree,
  leafId,
  lang,
  kinds,
  onChoose,
}: {
  tree: TreeLayout;
  leafId: string;
  lang: Lang;
  kinds: Set<RelationKind>;
  onChoose: (f: Focus) => void;
}) {
  const zh = lang === "zh";
  const leaf = tree.leaves.find((l) => l.entryId === leafId)!;
  const genus = tree.genera.find((g) => g.id === leaf.genusId)!;
  const family = tree.families.find((f) => f.id === leaf.familyId)!;
  const ties = tree.edges.filter((e) => kinds.has(e.kind) && (e.from === leafId || e.to === leafId));
  const refs = tree.references.filter((r) => r.entryId === leafId);
  return (
    <div className="flex flex-col gap-3">
      <p className="pw-label pr-6">
        <button type="button" onClick={() => onChoose({ kind: "family", id: family.id })} className="hover:text-ink">
          {family.numeral} · {family.scientificName}
        </button>
        {" › "}
        <button type="button" onClick={() => onChoose({ kind: "genus", id: genus.id })} className="hover:text-ink">
          {genus.scientificName}
        </button>
      </p>
      <div>
        <p className="font-display text-h3 leading-tight text-ink">{leaf.title[lang]}</p>
        {leaf.species ? <p className="mt-0.5 font-display text-lead text-phylum-ink italic">{leaf.species}</p> : null}
      </div>
      {ties.length ? (
        <ul className="flex flex-col gap-1.5 border-t border-rule pt-3 text-small">
          {ties.map((e) => {
            const otherId = e.from === leafId ? e.to : e.from;
            const other = tree.leaves.find((l) => l.entryId === otherId)!;
            const outgoing = e.from === leafId;
            return (
              <li key={e.id} className="flex items-baseline gap-2">
                <span className={cn("w-10 shrink-0 text-meta", EDGE[e.kind].className)}>
                  {RELATION_KINDS[e.kind].label[lang]}
                </span>
                <button
                  type="button"
                  onClick={() => onChoose({ kind: "leaf", id: otherId })}
                  className="min-w-0 text-left text-ink hover:text-[var(--phylum-ink)] hover:underline"
                >
                  {RELATION_KINDS[e.kind].symmetric ? "" : outgoing ? "→ " : "← "}
                  {other.title[lang]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-rule pt-3 text-small text-ink-3 italic">
          {zh ? "还没有记录关系。" : "No relations recorded yet."}
        </p>
      )}
      {refs.length ? (
        <p className="text-meta text-ink-3">
          {zh ? "跨属参照：" : "Cross-genus: "}
          {refs.map((r, i) => {
            const g = tree.genera.find((x) => x.id === r.genusId)!;
            return (
              <span key={r.id}>
                {i ? (zh ? "、" : ", ") : ""}
                <button
                  type="button"
                  onClick={() => onChoose({ kind: "genus", id: g.id })}
                  className="text-phylum-ink hover:underline"
                >
                  <i>{g.scientificName}</i>
                </button>
              </span>
            );
          })}
        </p>
      ) : null}
      <Link href={`/entries/${leaf.slug}`} className="pw-link mt-1 self-start text-small text-phylum-ink">
        {zh ? "打开条目" : "Open the entry"} →
      </Link>
    </div>
  );
}

function GenusCard({
  tree,
  genusId,
  lang,
  onChoose,
}: {
  tree: TreeLayout;
  genusId: string;
  lang: Lang;
  onChoose: (f: Focus) => void;
}) {
  const zh = lang === "zh";
  const genus = tree.genera.find((g) => g.id === genusId)!;
  const family = tree.families.find((f) => f.id === genus.familyId)!;
  const species = tree.leaves.filter((l) => l.genusId === genusId);
  const refs = tree.references.filter((r) => r.genusId === genusId);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onChoose({ kind: "family", id: family.id })}
        className="pw-label self-start pr-6 text-left hover:text-ink"
      >
        {family.numeral} · {family.name[lang]} · {family.scientificName}
      </button>
      <div>
        <p className="font-display text-h3 leading-tight text-ink">{genus.name[lang]}</p>
        <p className="mt-0.5 font-display text-lead text-phylum-ink italic">{genus.scientificName}</p>
      </div>
      <ul className="flex flex-col gap-1 border-t border-rule pt-3 text-small">
        {species.length ? (
          species.map((l) => (
            <li key={l.entryId}>
              <button
                type="button"
                onClick={() => onChoose({ kind: "leaf", id: l.entryId })}
                className="text-left text-ink hover:underline"
              >
                {l.title[lang]} {l.species ? <i className="text-ink-3">{l.species}</i> : null}
              </button>
            </li>
          ))
        ) : (
          <li className="pw-accession">{zh ? "待入藏" : "Awaiting accession"}</li>
        )}
        {refs.map((r) => {
          const l = tree.leaves.find((x) => x.entryId === r.entryId)!;
          return (
            <li key={r.id} className="text-ink-3">
              <span aria-hidden="true">⤳ </span>
              <button
                type="button"
                onClick={() => onChoose({ kind: "leaf", id: l.entryId })}
                className="hover:text-ink hover:underline"
              >
                {l.title[lang]}
              </button>
            </li>
          );
        })}
      </ul>
      <Link href={`/categories/${genus.slug}`} className="pw-link mt-1 self-start text-small text-phylum-ink">
        {zh ? "打开属页" : "Open the genus"} →
      </Link>
    </div>
  );
}

function FamilyCard({
  tree,
  familyId,
  lang,
  onChoose,
}: {
  tree: TreeLayout;
  familyId: string;
  lang: Lang;
  onChoose: (f: Focus) => void;
}) {
  const zh = lang === "zh";
  const family = tree.families.find((f) => f.id === familyId)!;
  const genera = tree.genera.filter((g) => g.familyId === familyId);
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-baseline gap-3 pr-6">
        <span className="font-display text-[2.5rem] leading-[0.8] text-transparent italic [-webkit-text-stroke:1px_var(--phylum)]">
          {family.numeral}
        </span>
        <span>
          <span className="block font-display text-h3 leading-tight text-ink">{family.name[lang]}</span>
          <span className="block font-display text-lead text-phylum-ink italic">{family.scientificName}</span>
        </span>
      </p>
      <ol className="flex flex-col border-t border-rule pt-2 text-small">
        {genera.map((g, i) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onChoose({ kind: "genus", id: g.id })}
              className="flex w-full items-baseline gap-2 py-0.5 text-left hover:text-ink"
            >
              <span className="w-4 font-display text-ink-3 italic">{i + 1}.</span>
              <i className="font-display text-ink">{g.scientificName}</i>
              <span className="pw-leader" aria-hidden="true" />
              <span className="text-ink-2">{g.name[lang]}</span>
            </button>
          </li>
        ))}
      </ol>
      <Link href={`/families/${family.slug}`} className="pw-link mt-1 self-start text-small text-phylum-ink">
        {zh ? "打开科页" : "Open the family"} →
      </Link>
    </div>
  );
}

// ── Instruments ───────────────────────────────────────────────────────────

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-xs font-display text-h4 leading-none text-ink-2 hover:bg-ink/6 hover:text-ink"
    >
      {children}
    </button>
  );
}

/**
 * A compass dial: the brick needle shows how far the tree is turned. Drag
 * around the dial to turn freely; the arrows beside it turn by 30°.
 */
function Dial({
  rotation,
  onTurn,
  onStep,
  lang,
}: {
  rotation: number;
  onTurn: (degrees: number) => void;
  onStep: (degrees: number) => void;
  lang: Lang;
}) {
  const zh = lang === "zh";
  const ref = useRef<SVGSVGElement>(null);
  const last = useRef<number | null>(null);
  const angleAt = (event: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return (Math.atan2(event.clientY - (r.top + r.height / 2), event.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  return (
    <div className="flex items-center gap-0.5">
      <ToolButton label={zh ? "逆时针旋转" : "Turn anticlockwise"} onClick={() => onStep(-30)}>
        ↺
      </ToolButton>
      <svg
        ref={ref}
        viewBox="-20 -20 40 40"
        role="slider"
        aria-label={zh ? "旋转" : "Rotation"}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={Math.round(((((rotation + 180) % 360) + 360) % 360) - 180)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") onStep(-15);
          if (event.key === "ArrowRight" || event.key === "ArrowUp") onStep(15);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          ref.current?.setPointerCapture(event.pointerId);
          last.current = angleAt(event);
        }}
        onPointerMove={(event) => {
          if (last.current === null) return;
          const a = angleAt(event);
          onTurn(((a - last.current + 540) % 360) - 180);
          last.current = a;
        }}
        onPointerUp={() => (last.current = null)}
        className="size-10 cursor-grab touch-none focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo"
      >
        <circle
          r="17"
          fill="var(--color-paper-sheet)"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-rule-strong"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1="-17"
            x2="0"
            y2={i % 3 ? -15 : -13}
            stroke="currentColor"
            strokeWidth="0.7"
            transform={`rotate(${i * 30})`}
            className="text-ink-3"
          />
        ))}
        <g transform={`rotate(${Math.round(rotation * 10) / 10})`}>
          <path d="M0 -13 L2.4 0 L0 3 L-2.4 0 Z" className="fill-brick" />
          <path d="M0 13 L2.4 0 L0 -3 L-2.4 0 Z" className="fill-ink-3" opacity="0.6" />
        </g>
        <circle r="1.6" className="fill-ink" />
      </svg>
      <ToolButton label={zh ? "顺时针旋转" : "Turn clockwise"} onClick={() => onStep(30)}>
        ↻
      </ToolButton>
    </div>
  );
}

function Legend({
  lang,
  kinds,
  setKinds,
  showRefs,
  setShowRefs,
}: {
  lang: Lang;
  kinds: Set<RelationKind>;
  setKinds: (update: (s: Set<RelationKind>) => Set<RelationKind>) => void;
  showRefs: boolean;
  setShowRefs: (update: (v: boolean) => boolean) => void;
}) {
  const zh = lang === "zh";
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <legend className="sr-only">{zh ? "关系类型" : "Relation kinds"}</legend>
      {RELATION_KIND_IDS.map((k) => (
        <label key={k} className="flex cursor-pointer items-center gap-1.5 text-small text-ink-2">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={kinds.has(k)}
            onChange={() =>
              setKinds((s) => {
                const next = new Set(s);
                if (next.has(k)) next.delete(k);
                else next.add(k);
                return next;
              })
            }
          />
          <svg
            viewBox="0 0 28 6"
            aria-hidden="true"
            className={cn("h-1.5 w-7 peer-[:not(:checked)]:opacity-25", EDGE[k].className)}
          >
            <line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="1.6" strokeDasharray={EDGE[k].dash} />
          </svg>
          <span className="peer-[:not(:checked)]:text-ink-3 peer-[:not(:checked)]:line-through peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-indigo">
            {RELATION_KINDS[k].label[lang]}
          </span>
        </label>
      ))}
      <label className="flex cursor-pointer items-center gap-1.5 text-small text-ink-2">
        <input type="checkbox" className="peer sr-only" checked={showRefs} onChange={() => setShowRefs((v) => !v)} />
        <svg viewBox="0 0 28 6" aria-hidden="true" className="h-1.5 w-7 text-ink-2 peer-[:not(:checked)]:opacity-25">
          <line
            x1="0"
            y1="3"
            x2="28"
            y2="3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="0.1 3.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="peer-[:not(:checked)]:text-ink-3 peer-[:not(:checked)]:line-through peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-indigo">
          {zh ? "跨属参照" : "Cross-genus"}
        </span>
      </label>
    </fieldset>
  );
}
