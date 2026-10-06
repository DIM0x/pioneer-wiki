import "server-only";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { FriendLink, Lang } from "@/lib/model/types";
import {
  HILLS,
  HILL_WIDTH,
  SHEETS,
  chart,
  hillGlyph,
  partition,
  pt,
  realm,
  type Chart,
  type ChartLabel,
  type ChartPlace,
  type Point,
} from "@/lib/links/chart";
import { realmSvg } from "@/lib/links/realm-svg";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Vignette } from "@/components/book/Vignette";
import { ChartStage } from "./ChartStage";

/*
 * 友邻疆域图 — the Links part printed as one engraved, hand-coloured map
 * (lib/links/chart.ts lays it out). The land is drawn once in a shared
 * <defs>, in two layers that both sheets place with their own transform: the
 * base (water lines, land, sand, rivers) and the colouring (washes, borders,
 * coast). Hills, woods and all type are set upright on each sheet between
 * them. A territory's wash deepens when its `--lit-<seat>` property is set
 * (ChartStage does that), because custom properties reach inside <use>.
 */

const sx = (n: number) => Math.round(n * 10) / 10;

/** Line weights scale with the sheet: the tall sheet prints at about half the size. */
const WEIGHT = { wide: 1, tall: 1.9 } as const;

function RealmDefs({ places }: { places: ChartPlace[] }) {
  const r = realm();
  const territories = partition(places.length);
  const [x0, y0, x1, y1] = r.box;
  const box = { x: x0 - 60, y: y0 - 60, width: x1 - x0 + 120, height: y1 - y0 + 120 };
  const coast = "#pw-realm-coast";
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <path id="pw-realm-coast" d={r.coast} />
        <clipPath id="pw-realm-clip">
          <use href={coast} />
        </clipPath>
        <mask id="pw-realm-sea" maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <use href={coast} fill="#000" />
        </mask>
        {territories.map((t) => (
          <g key={t.seat}>
            <path id={`pw-t-${t.seat}`} d={t.path} />
            <clipPath id={`pw-tc-${t.seat}`}>
              <use href={`#pw-t-${t.seat}`} />
            </clipPath>
          </g>
        ))}

        {/* A fir: a stem and four tiers of branches, standing on (0, 0). */}
        <g id="pw-fir">
          <path d="M0,1.2V-6.2" className="pw-chart-trunk" />
          <path
            d="M-1,-4.7L0,-5.9L1,-4.7M-1.6,-3.1L0,-4.5L1.6,-3.1M-2.2,-1.4L0,-3L2.2,-1.4M-2.6,0.3L0,-1.4L2.6,0.3"
            className="pw-chart-fir"
          />
        </g>
        {HILLS.map((v, i) => {
          const g = hillGlyph([0, 0], HILL_WIDTH, HILL_WIDTH * v.h, v.lean);
          return (
            <g key={i} id={`pw-hill-${i}`}>
              <path d={g.body} className="pw-chart-hill" />
              <path d={g.line} className="pw-chart-hill-line" />
            </g>
          );
        })}

        <g id="pw-realm-wash">
          <g clipPath="url(#pw-realm-clip)">
            {places.map((p) => (
              <g
                key={p.seat}
                data-kind={p.kind}
                style={{ "--wash": p.wash, "--lit": `var(--lit-${p.seat}, 0)` } as CSSProperties}
              >
                <use href={`#pw-t-${p.seat}`} className="pw-chart-tint" />
                {p.kind === "home" || p.kind === "charted" ? (
                  <g clipPath={`url(#pw-tc-${p.seat})`}>
                    <use href={`#pw-t-${p.seat}`} className="pw-chart-wash" />
                    <use href={coast} className="pw-chart-wash" />
                  </g>
                ) : null}
              </g>
            ))}
            <g className="pw-chart-borders">
              {places.map((p) =>
                p.kind === "blank" ? null : (
                  <use
                    key={p.seat}
                    href={`#pw-t-${p.seat}`}
                    className={p.kind === "next" ? "pw-chart-next" : undefined}
                  />
                ),
              )}
            </g>
          </g>
          <g mask="url(#pw-realm-sea)">
            <use href={coast} className="pw-chart-shadow" transform="translate(1.2 1.6)" />
          </g>
          <use href={coast} className="pw-chart-coast" />
        </g>
      </defs>
    </svg>
  );
}

function Label({ label, className }: { label: ChartLabel; className?: string }) {
  const text = (
    <text
      x={sx(label.at[0])}
      y={sx(label.at[1])}
      textAnchor="middle"
      className={cn("pw-chart-label", !label.leader && className)}
    >
      {label.lines.map((l, i) => (
        <tspan
          key={i}
          x={sx(label.at[0])}
          dy={i === 0 ? 0 : sx(l.size * 1.3)}
          fontSize={sx(l.size)}
          lang={l.lang === "zh" ? "zh-CN" : "en"}
          className={l.alt ? "pw-chart-alt" : "pw-chart-name"}
        >
          {l.text}
        </tspan>
      ))}
    </text>
  );
  if (!label.leader) return text;
  const [from, to] = label.leader;
  return (
    <>
      <path d={`M${pt(from)}L${pt(to)}`} className="pw-chart-leader-line" />
      <circle cx={sx(to[0])} cy={sx(to[1])} r="1.6" className="pw-chart-leader-dot" />
      {text}
    </>
  );
}

/** A sixteen-point rose; `north` turns it (degrees clockwise) to match the land on the sheet. */
function Rose({ at: [x, y], radius: r, north }: { at: Point; radius: number; north: number }) {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const len = i % 4 === 0 ? r : i % 2 === 0 ? r * 0.68 : r * 0.42;
    const half = i % 4 === 0 ? r * 0.11 : i % 2 === 0 ? r * 0.08 : r * 0.06;
    const tip: Point = [Math.cos(a) * len, Math.sin(a) * len];
    const left: Point = [Math.cos(a - Math.PI / 2) * half, Math.sin(a - Math.PI / 2) * half];
    const right: Point = [Math.cos(a + Math.PI / 2) * half, Math.sin(a + Math.PI / 2) * half];
    return { i, tip, left, right, rank: i % 4 === 0 ? 0 : i % 2 === 0 ? 1 : 2 };
  });
  // Shorter points first, so the cardinal points lie over them.
  const order = [...points].sort((a, b) => b.rank - a.rank);
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r0 = r * 1.06;
    const r1 = r * (i % 2 === 0 ? 1.16 : 1.11);
    return `M${pt([Math.cos(a) * r0, Math.sin(a) * r0])}L${pt([Math.cos(a) * r1, Math.sin(a) * r1])}`;
  }).join("");
  return (
    <g className="pw-chart-rose" transform={`translate(${sx(x)} ${sx(y)})`} aria-hidden="true">
      <g transform={north ? `rotate(${north})` : undefined}>
        <circle r={sx(r * 1.06)} className="pw-chart-rose-ring" />
        <circle r={sx(r * 1.16)} className="pw-chart-rose-ring" />
        <path d={ticks} className="pw-chart-rose-ticks" />
        <circle r={sx(r * 0.5)} className="pw-chart-rose-ring" />
        {order.map(({ i, tip, left, right }) => (
          <g key={i}>
            <path d={`M0,0L${pt(left)}L${pt(tip)}Z`} className="pw-chart-rose-lit" />
            <path d={`M0,0L${pt(right)}L${pt(tip)}Z`} className="pw-chart-rose-dark" />
          </g>
        ))}
        <circle r={sx(r * 0.05)} className="pw-chart-rose-dark" />
      </g>
      {/* The N stands upright beyond the north point, wherever north lies. */}
      <text
        x={sx(Math.sin((north * Math.PI) / 180) * r * 1.3)}
        y={sx(-Math.cos((north * Math.PI) / 180) * r * 1.3 + r * 0.1)}
        textAnchor="middle"
        fontSize={sx(r * 0.3)}
        className="pw-chart-rose-n"
      >
        N
      </text>
    </g>
  );
}

/** The capital: a star in a ring, as atlases mark a seat of government. */
function Capital({ at: [x, y], scale }: { at: Point; scale: number }) {
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? 2.4 : 5.6;
    return pt([Math.cos(a) * rr, Math.sin(a) * rr]);
  }).join(" ");
  return (
    <g transform={`translate(${sx(x)} ${sx(y)}) scale(${scale})`} className="pw-chart-capital" aria-hidden="true">
      <circle r="8.2" />
      <path d={`M${star}Z`} />
    </g>
  );
}

function TitleBlock({ c, lang }: { c: Chart; lang: Lang }) {
  const zh = lang === "zh";
  const k = c.shape === "wide" ? 1 : 1.62;
  const n = (v: number) => sx(v * k);
  return (
    <g transform={`translate(${sx(c.title.x0)} ${sx(c.title.y0)})`} className="pw-chart-title">
      <text y={n(12)} fontSize={n(11)} className="pw-chart-caps">
        {zh ? "A MAP OF THE FRIENDLY LANDS" : "A MAP OF THE"}
      </text>
      <text y={n(54)} fontSize={n(zh ? 38 : 40)} className="pw-chart-title-main">
        {zh ? "友邻疆域图" : "Friendly Lands"}
      </text>
      <text y={n(78)} fontSize={n(13)} lang={zh ? "en" : "zh-CN"} className="pw-chart-italic">
        {zh ? "with the realm of Pioneer Wiki and its neighbours" : "友邻疆域图 · 先锋维基及其近邻"}
      </text>
      <path d={`M0,${n(96)}h${n(200)}`} className="pw-chart-title-rule" />
      <text y={n(116)} fontSize={n(12)} className="pw-chart-italic">
        {zh ? "为先锋维基测绘 · 第一版 · MMXXVI" : "Surveyed for Pioneer Wiki · First edition · MMXXVI"}
      </text>
      <g transform={`translate(0 ${n(146)})`}>
        {Array.from({ length: 4 }, (_, i) => (
          <rect
            key={i}
            x={n(i * 40)}
            y={0}
            width={n(40)}
            height={n(4.5)}
            className={i % 2 ? "pw-chart-bar-open" : "pw-chart-bar"}
          />
        ))}
        {[0, 2, 4].map((i) => (
          <text key={i} x={n(i * 40)} y={n(17)} fontSize={n(9.5)} textAnchor="middle" className="pw-chart-italic">
            {i * 25}
          </text>
        ))}
        <text x={n(172)} y={n(5.5)} fontSize={n(10)} className="pw-chart-caps">
          {zh ? "里格 LEAGUES" : "LEAGUES"}
        </text>
      </g>
    </g>
  );
}

function Sheet({ c, lang, className }: { c: Chart; lang: Lang; className?: string }) {
  const zh = lang === "zh";
  const t = SHEETS[c.shape].type;
  const [W, H] = c.size;
  const id = `pw-chart-${c.shape}`;
  const glyph = SHEETS[c.shape].glyph;
  const reach = Math.hypot(W, H);
  const rhumbs = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return `M${pt(c.rose.at)}L${pt([c.rose.at[0] + Math.cos(a) * reach, c.rose.at[1] + Math.sin(a) * reach])}`;
  }).join("");
  const graticule = [
    ...c.grid.xs.slice(1, -1).map((x) => `M${sx(x)},0V${H}`),
    ...c.grid.ys.slice(1, -1).map((y) => `M0,${sx(y)}H${W}`),
  ].join("");
  const edge = c.shape === "wide" ? 14 : 26;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("pw-chart block h-auto w-full", className)}
      data-shape={c.shape}
      style={{ "--weight": WEIGHT[c.shape] } as CSSProperties}
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>{zh ? "友邻疆域图" : "A map of the Friendly Lands"}</title>
      <defs>
        <filter id={`${id}-feather`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={c.shape === "wide" ? 22 : 34} />
        </filter>
        <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <rect
            x={edge * 3}
            y={edge * 3}
            width={W - edge * 6}
            height={H - edge * 6}
            fill="#fff"
            filter={`url(#${id}-feather)`}
          />
        </mask>
      </defs>

      {/* The open sea fades into the page at the edges; the land and its type do not. */}
      <g mask={`url(#${id}-fade)`} aria-hidden="true">
        <path d={graticule} className="pw-chart-graticule" />
        <path d={rhumbs} className="pw-chart-rhumb" />
        <g className="pw-chart-soundings">
          {c.soundings.map((s, i) => (
            <text key={i} x={sx(s.at[0])} y={sx(s.at[1])} fontSize={t.sounding} textAnchor="middle">
              {s.depth}
            </text>
          ))}
        </g>
      </g>

      <use href={`/links/realm.svg?v=${realmSvg().version}#pw-realm-base`} transform={c.transform} />
      <g className="pw-chart-relief" aria-hidden="true">
        {c.trees.map((p, i) => (
          <use
            key={i}
            href="#pw-fir"
            transform={`translate(${sx(p[0])} ${sx(p[1])})${glyph === 1 ? "" : ` scale(${glyph})`}`}
          />
        ))}
        {c.hills.map((h, i) => (
          <use
            key={i}
            href={`#pw-hill-${h.variant}`}
            transform={`translate(${sx(h.at[0])} ${sx(h.at[1])}) scale(${Math.round(h.scale * 100) / 100})`}
          />
        ))}
      </g>
      <use href="#pw-realm-wash" transform={c.transform} />

      {c.places.map((p) => (
        <Place key={p.seat} place={p} c={c} lang={lang} />
      ))}
      <Capital at={c.capital.at} scale={WEIGHT[c.shape]} />
      <Label label={c.capital.label} className="pw-chart-label-land" />
      {c.incognita ? <Label label={c.incognita} className="pw-chart-label-land pw-chart-incognita" /> : null}

      {c.sea ? (
        <text x={sx(c.sea.at[0])} y={sx(c.sea.at[1])} textAnchor="middle" className="pw-chart-sea" aria-hidden="true">
          <tspan fontSize={t.sea}>{c.sea.text}</tspan>
          <tspan x={sx(c.sea.at[0])} dy={sx(t.sea * 1.15)} fontSize={sx(t.sea * 0.52)} className="pw-chart-sea-alt">
            {c.sea.alt}
          </tspan>
        </text>
      ) : null}
      <Rose at={c.rose.at} radius={c.rose.radius} north={c.shape === "wide" ? 0 : 90} />
      <TitleBlock c={c} lang={lang} />

      <g className="pw-chart-margin" aria-hidden="true">
        {c.grid.columns.map((l, i) => (
          <text
            key={l}
            x={sx((c.grid.xs[i] + c.grid.xs[i + 1]) / 2)}
            y={sx(edge)}
            fontSize={t.grid}
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
        {c.grid.rows.map((n, i) => (
          <text
            key={n}
            x={sx(edge * 0.6)}
            y={sx((c.grid.ys[i] + c.grid.ys[i + 1]) / 2 + t.grid * 0.35)}
            fontSize={t.grid}
          >
            {n}
          </text>
        ))}
      </g>
    </svg>
  );
}

/** A territory on the sheet: its clickable land (clipped to the coast) and its name. */
function Place({ place: p, c, lang }: { place: ChartPlace; c: Chart; lang: Lang }) {
  const zh = lang === "zh";
  const body = (
    <>
      <g transform={c.transform}>
        <use href={`#pw-t-${p.seat}`} className="pw-chart-hit" clipPath="url(#pw-realm-clip)" />
      </g>
      {p.label ? <Label label={p.label} className="pw-chart-label-land" /> : null}
    </>
  );
  if (p.kind === "home")
    return (
      <g data-slot={p.seat} className="pw-chart-place" data-kind={p.kind}>
        {body}
      </g>
    );
  if (!p.link)
    return (
      <Link
        href="/forum"
        scroll={false}
        data-slot={p.seat}
        data-territory=""
        data-kind={p.kind}
        className="pw-chart-place"
        aria-label={zh ? "未勘之地：去交流区申请友链" : "Uncharted land: ask in the forum to be charted"}
      >
        {body}
      </Link>
    );
  return (
    <a
      href={p.link.url}
      target="_blank"
      rel="noreferrer"
      data-slot={p.seat}
      data-territory=""
      data-kind={p.kind}
      className="pw-chart-place"
      aria-label={`${p.number}. ${p.link.name[lang]} — ${p.link.url.replace(/^https?:\/\//, "")}`}
    >
      {body}
    </a>
  );
}

/** The slip that opens over a territory: what the site keeps, and since when we have been neighbours. */
function Card({ place: p, c, lang }: { place: ChartPlace; c: Chart; lang: Lang }) {
  const zh = lang === "zh";
  const other = zh ? "en" : "zh";
  const [W, H] = c.size;
  const left = (p.pole[0] / W) * 100;
  const top = (p.pole[1] / H) * 100;
  // Beside the territory on the wide sheet; on the tall one, across the half it is not in.
  const side = c.shape === "wide" ? (left > 58 ? "left" : "right") : top > 50 ? "top" : "bottom";
  const style = {
    "--wash": p.wash,
    ...(c.shape === "wide" ? { left: `${left}%`, top: `${top}%` } : {}),
  } as CSSProperties;
  const l = p.link;
  return (
    <div data-slot={p.seat} data-card={c.shape} data-side={side} className="pw-chart-card" style={style}>
      <div className="pw-chart-card-sheet">
        {l ? (
          <>
            <div className="flex items-start gap-4">
              <Vignette name={l.emblem} className="w-14 shrink-0" sizes="56px" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
                  <span>No. {String(p.number).padStart(2, "0")}</span>
                  <span>{p.grid}</span>
                  {l.sample ? <span className="pw-stamp normal-case">{zh ? "示例" : "sample"}</span> : null}
                </p>
                <p className="mt-1 font-display text-h4 leading-tight text-ink">{l.name[lang]}</p>
                {l.name[other] !== l.name[lang] ? (
                  <p lang={other === "zh" ? "zh-CN" : "en"} className="font-display text-small text-ink-3 italic">
                    {l.name[other]}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-small leading-relaxed text-ink-2">{l.description[lang]}</p>
            <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-meta">
              <span className="truncate text-part-ink">{l.url.replace(/^https?:\/\//, "")}</span>
              <span className="text-ink-3">
                {zh ? "结交于" : "Neighbours since"} {formatDate(l.since, lang)}
              </span>
            </p>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="pw-chart-card-go pw-link mt-3 text-small text-part-ink"
            >
              {zh ? "前往" : "Visit"} <span className="pw-nudge">↗</span>
            </a>
          </>
        ) : (
          <>
            <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">{p.grid}</p>
            <p className="mt-1 font-display text-h4 leading-tight text-ink">{zh ? "未勘之地" : "Terra incognita"}</p>
            <p className="mt-2 text-small leading-relaxed text-ink-2">
              {p.kind === "next"
                ? zh
                  ? "这片疆域还没有主人。下一个与我们互换友链的站点，会被画在这里。"
                  : "This territory has no holder yet. The next site to exchange links with us will be charted here."
                : zh
                  ? "尚未勘测的土地。友邻越多，地图上的空白就越少。"
                  : "Land not yet surveyed. The more friends we have, the less of the map is blank."}
            </p>
            <Link href="/forum" scroll={false} className="pw-chart-card-go pw-link mt-3 text-small text-part-ink">
              {zh ? "去交流区申请" : "Ask in the forum"} <span className="pw-nudge">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/** The atlas index: every friend's territory, its grid square, and what it keeps. */
function Index({ places, lang }: { places: ChartPlace[]; lang: Lang }) {
  const zh = lang === "zh";
  const other = zh ? "en" : "zh";
  const charted = places.filter((p) => p.link).sort((a, b) => a.number - b.number);
  return (
    <section aria-labelledby="pw-chart-index" className="mt-(--space-block)">
      <h3 id="pw-chart-index" className="pw-ink-under flex items-baseline justify-between gap-4 font-display text-h3">
        <span>
          {zh ? "疆域索引" : "Index of territories"}
          <span lang={zh ? "en" : "zh-CN"} className="ml-3 text-small font-normal text-ink-3">
            {zh ? "Index of territories" : "疆域索引"}
          </span>
        </span>
        <span className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">{zh ? "图格" : "Square"}</span>
      </h3>
      <ol className="mt-6 grid gap-x-(--space-block) gap-y-6 md:grid-cols-2">
        {charted.map((p) =>
          p.link ? (
            <li
              key={p.seat}
              data-slot={p.seat}
              className="pw-chart-entry"
              style={{ "--wash": p.wash } as CSSProperties}
            >
              <a href={p.link.url} target="_blank" rel="noreferrer" className="group block no-underline">
                <span className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="pw-chart-swatch" />
                  <span className="w-5 shrink-0 font-display text-small text-ink-3 italic">{p.number}</span>
                  <span className="min-w-0 font-display text-h4 leading-tight text-ink">
                    <span className="pw-link">{p.link.name[lang]}</span>
                    {p.link.name[other] !== p.link.name[lang] ? (
                      <span lang={other === "zh" ? "zh-CN" : "en"} className="ml-2 text-small text-ink-3 italic">
                        {p.link.name[other]}
                      </span>
                    ) : null}
                  </span>
                  <span aria-hidden="true" className="pw-chart-leader" />
                  <span className="font-mono text-meta tracking-[0.1em] text-part-ink">{p.grid}</span>
                </span>
                <span className="mt-1 block pl-12 text-small leading-relaxed text-ink-2">
                  {p.link.description[lang]}
                </span>
                <span className="mt-1 block pl-12 font-mono text-[0.6875rem] tracking-[0.06em] text-ink-3">
                  {p.link.url.replace(/^https?:\/\//, "")} · {zh ? "结交于" : "since"} {formatDate(p.link.since, lang)}
                  {p.link.sample ? <span className="pw-stamp ml-3 normal-case">{zh ? "示例" : "sample"}</span> : null}
                </span>
              </a>
            </li>
          ) : null,
        )}
      </ol>
    </section>
  );
}

export function LinksChart({ links, lang }: { links: FriendLink[]; lang: Lang }) {
  const wide = chart(links, "wide", lang);
  const tall = chart(links, "tall", lang);
  const [W, H] = wide.size;
  return (
    <ChartStage className="pw-chart-stage">
      <RealmDefs places={wide.places} />
      <figure className="relative">
        <div
          className="relative hidden md:block"
          data-reveal="ink"
          style={
            {
              "--ink-x": `${(wide.capital.at[0] / W) * 100}%`,
              "--ink-y": `${(wide.capital.at[1] / H) * 100}%`,
            } as CSSProperties
          }
        >
          <Sheet c={wide} lang={lang} />
          {wide.places.map((p) => (p.kind === "home" ? null : <Card key={p.seat} place={p} c={wide} lang={lang} />))}
        </div>
        <div
          className="relative md:hidden"
          data-reveal="ink"
          style={{ "--ink-x": "50%", "--ink-y": "50%" } as CSSProperties}
        >
          <Sheet c={tall} lang={lang} />
          {tall.places.map((p) => (p.kind === "home" ? null : <Card key={p.seat} place={p} c={tall} lang={lang} />))}
        </div>
      </figure>
      <Index places={wide.places} lang={lang} />
    </ChartStage>
  );
}
