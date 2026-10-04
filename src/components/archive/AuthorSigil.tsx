import { cn } from "@/lib/utils";

/*
 * Ink sigil used instead of photo avatars: a seed-derived radial figure, like
 * a collector's stamp. Deterministic, so server and client render the same.
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function AuthorSigil({ seed, label, className }: { seed: string; label?: string; className?: string }) {
  const h = hash(seed);
  const arms = 3 + (h % 5);
  const inner = 4 + ((h >> 3) % 4);
  const twist = ((h >> 6) % 30) - 15;
  const paths = Array.from({ length: arms }, (_, i) => {
    const a = ((360 / arms) * i + twist) * (Math.PI / 180);
    const x = 16 + Math.cos(a) * 10.5;
    const y = 16 + Math.sin(a) * 10.5;
    return `M16 16 L${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 32 32"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("size-7 shrink-0 rounded-full bg-paper-deep text-ink-2", className)}
      fill="none"
      stroke="currentColor"
    >
      <circle cx="16" cy="16" r="14.5" strokeWidth="0.8" />
      <path d={paths} strokeWidth="1" strokeLinecap="round" />
      <circle cx="16" cy="16" r={inner / 2} className="fill-paper-sheet" strokeWidth="1" />
    </svg>
  );
}
