import { cn } from "@/lib/utils";

/** A physical key, drawn like a typewriter key cap. Decorative unless labelled. */
export function KeyboardHint({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex min-w-[1.35rem] items-center justify-center rounded-xs border border-rule-strong border-b-2 bg-paper-sheet px-1 font-mono text-[0.6875rem] leading-[1.15rem] text-ink-2"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
