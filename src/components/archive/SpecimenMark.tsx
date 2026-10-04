import { cn } from "@/lib/utils";
import type { ReviewState, Scale } from "@/lib/model/types";

/*
 * Procedural specimen glyph for an entry, drawn from its metadata only:
 * - scale: macro = a large cell with a nucleus; micro = a small node with hyphae
 * - growth rings: one faint ring per revision (version history as tree rings)
 * - dashed outer ring: the entry has a biological analogue (cross-disciplinary)
 * - fill colour follows review state, matching StatusBadge
 */

const stateFill: Record<ReviewState, string> = {
  draft: "fill-gold",
  in_review: "fill-indigo",
  published: "fill-moss",
};

interface SpecimenMarkProps {
  scale: Scale;
  rings: number;
  state: ReviewState;
  crossover?: boolean;
  className?: string;
}

export function SpecimenMark({ scale, rings, state, crossover = false, className }: SpecimenMarkProps) {
  const n = Math.max(1, Math.min(rings, 5));
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("size-12 shrink-0 text-ink-3", className)} fill="none" stroke="currentColor">
      {crossover ? <circle cx="24" cy="24" r="22.5" strokeWidth="0.8" strokeDasharray="2 2.6" className="text-brick" /> : null}
      {scale === "macro" ? (
        <>
          <circle cx="24" cy="24" r="19" strokeWidth="1.1" />
          {Array.from({ length: n }, (_, i) => (
            <circle key={i} cx="24" cy="24" r={16 - i * 2.6} strokeWidth="0.5" opacity={0.55 - i * 0.07} />
          ))}
          <circle cx="24" cy="24" r="3.6" stroke="none" className={stateFill[state]} />
        </>
      ) : (
        <>
          <path
            d="M24 24 13 15m11 9 12-8m-12 8-3 14m3-14 13 7M13 15l-4-1m4 1-1-5m23 6 4-3m-4 3 1 4M21 38l-4 2m4-2 3 4m13-11 4 0"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {Array.from({ length: n }, (_, i) => (
            <circle key={i} cx="24" cy="24" r={6.5 + i * 2.2} strokeWidth="0.45" opacity={0.6 - i * 0.08} />
          ))}
          <circle cx="24" cy="24" r="3" stroke="none" className={stateFill[state]} />
        </>
      )}
    </svg>
  );
}
