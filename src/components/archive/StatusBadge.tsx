import { cn } from "@/lib/utils";
import type { Lang, ReviewState } from "@/lib/model/types";
import { REVIEW_STATES } from "@/lib/model/vocab";

/*
 * Review state = text + icon + colour, never colour alone. The glyph is the
 * biological form: spore (draft) → branching (in review) → specimen (published).
 */

const tone: Record<ReviewState, string> = {
  draft: "text-gold-ink border-gold/60",
  in_review: "text-indigo border-indigo/40",
  published: "text-moss-ink border-moss/50",
};

export function StateGlyph({ state, className }: { state: ReviewState; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3.5 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.2">
      {state === "draft" ? (
        <>
          <circle cx="8" cy="8" r="2.4" />
          <circle cx="3.4" cy="4.2" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12.6" cy="5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="11.4" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="4.4" cy="11.6" r="0.6" fill="currentColor" stroke="none" />
        </>
      ) : state === "in_review" ? (
        <path d="M8 14.5V8m0 0L4 4.2M8 8l4.2-3.4M4 4.2V1.8M4 4.2 1.8 3M12.2 4.6l1.6-2.2M12.2 4.6 14.6 5" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="3.6" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

interface StatusBadgeProps {
  state: ReviewState;
  lang: Lang;
  /** Also show the biological form name ("Spore"). */
  showForm?: boolean;
  className?: string;
}

export function StatusBadge({ state, lang, showForm = false, className }: StatusBadgeProps) {
  const meta = REVIEW_STATES[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 text-meta font-medium whitespace-nowrap",
        tone[state],
        className,
      )}
    >
      <StateGlyph state={state} />
      <span>{meta.label[lang]}</span>
      {showForm ? <span className="font-normal opacity-80">· {meta.form[lang]}</span> : null}
    </span>
  );
}
