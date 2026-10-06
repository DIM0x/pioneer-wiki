"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chronicleListHref, CHRONICLE_QUERY_MAX, searchWords, type ChronicleView } from "@/lib/chronicles/query";
import type { ChronicleKind } from "@/lib/model/types";
import { FilterSelect } from "@/components/search/filter-select";

export interface FinderLabels {
  search: string;
  searchHint: string;
  searchSubmit: string;
  filters: string;
  year: string;
  allYears: string;
  kind: string;
  allKinds: string;
  member: string;
  allMembers: string;
  pending: string;
}

/**
 * The archive's standing tools: words to find, then year, kind and member,
 * drawn with the site's own fields (the ledger line and the filter select).
 * One GET form, so it works before the script arrives; with it, words are sent
 * on Enter or the button (never per keystroke, and never while an input method
 * is still composing), a filter applies as soon as it is chosen, and every
 * change becomes a canonical URL that can be shared, refreshed and stepped back from.
 */
export function ChronicleFinder({
  view,
  years,
  kinds,
  members,
  labels,
}: {
  view: ChronicleView;
  /** [value, label] pairs, as FilterSelect takes them. */
  years: Array<[string, string]>;
  kinds: Array<[string, string]>;
  members: Array<[string, string]>;
  labels: FinderLabels;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  // The words in the box go with any change, so typing and then picking a year searches both.
  const words = () => {
    const value = form.current ? new FormData(form.current).get("q") : null;
    return searchWords(typeof value === "string" ? value : undefined);
  };
  const go = (change: Partial<ChronicleView>) =>
    startTransition(() => router.push(chronicleListHref(view, { q: words(), ...change }), { scroll: false }));

  return (
    <form
      ref={form}
      action="/chronicles"
      method="get"
      role="search"
      aria-label={labels.filters}
      aria-busy={pending || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        go({});
      }}
      className="grid items-end gap-x-8 gap-y-5 transition-opacity duration-(--dur-quick) aria-busy:opacity-60 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_10rem]"
    >
      <label className="flex min-w-0 flex-col gap-1">
        <span className="pw-label">{labels.search}</span>
        <span className="flex items-center gap-3">
          <input
            name="q"
            type="search"
            defaultValue={view.q ?? ""}
            maxLength={CHRONICLE_QUERY_MAX}
            placeholder={labels.searchHint}
            enterKeyHint="search"
            autoComplete="off"
            onKeyDown={(e) => {
              // Enter that commits an input method's composition is not a search.
              if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
            }}
            className="pw-field h-9 min-w-0 flex-1 text-body"
          />
          <button type="submit" className="pw-finder-submit">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3.5 3.5" strokeLinecap="round" />
            </svg>
            <span>{labels.searchSubmit}</span>
          </button>
        </span>
      </label>

      <div className="grid grid-cols-3 gap-x-4 sm:gap-x-8 lg:contents">
        <FilterSelect
          name="year"
          label={labels.year}
          value={view.year ? String(view.year) : ""}
          options={[["", labels.allYears], ...years]}
          onValueChange={(value) => go({ year: value ? Number(value) : undefined })}
        />
        <FilterSelect
          name="kind"
          label={labels.kind}
          value={view.kind ?? ""}
          options={[["", labels.allKinds], ...kinds]}
          onValueChange={(value) => go({ kind: (value || undefined) as ChronicleKind | undefined })}
        />
        <FilterSelect
          name="member"
          label={labels.member}
          value={view.member ?? ""}
          options={[["", labels.allMembers], ...members]}
          onValueChange={(value) => go({ member: value || undefined })}
        />
      </div>

      <p role="status" className="sr-only">
        {pending ? labels.pending : ""}
      </p>
    </form>
  );
}
