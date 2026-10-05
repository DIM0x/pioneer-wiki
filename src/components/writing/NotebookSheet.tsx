"use client";

import { useId, type RefObject } from "react";
import type { Lang } from "@/lib/model/types";
import { cn } from "@/lib/utils";

/** Characters and lines, as a field note would record them. */
function counts(text: string) {
  const chars = [...text.replace(/\s/g, "")].length;
  const lines = text ? text.split("\n").length : 0;
  return { chars, lines };
}

/**
 * A field-notebook pad for long writing: a stack of sheets, punched holes, a
 * double red margin, ruling that scrolls with the text, a printed form head
 * and a footer that keeps count. The textarea stays a plain, labelled textarea.
 */
export function NotebookSheet({
  value,
  onChange,
  lang,
  label,
  head,
  hint,
  mono = false,
  placeholder,
  className,
  textareaRef,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  label: string;
  /** Printed form fields: [label, value] pairs set in the sheet's head. */
  head: Array<[string, string]>;
  /** One line printed at the foot (e.g. the syntax in use). */
  hint?: string;
  mono?: boolean;
  placeholder?: string;
  className?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const id = useId();
  const { chars, lines } = counts(value);
  const zh = lang === "zh";
  return (
    <div className={cn("pw-notebook", className)}>
      <div className="pw-notebook-sheet h-full">
        <div aria-hidden="true" className="pw-notebook-holes">
          <span />
          <span />
          <span />
        </div>
        <p className="pw-notebook-head">
          <label htmlFor={id} className="text-ink">
            <b>{label}</b>
          </label>
          {head.map(([k, v]) => (
            <span key={k}>
              <b>{k}</b> <span data-fill>{v}</span>
            </span>
          ))}
        </p>
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          ref={textareaRef}
          onKeyDown={onKeyDown}
          spellCheck={false}
          placeholder={placeholder}
          className={cn("pw-notebook-text", mono ? "font-mono text-[0.875rem]" : "text-body")}
        />
        <p className="pw-notebook-foot">
          <span>{hint}</span>
          <span aria-live="polite">
            {zh ? `${chars} 字 · ${lines} 行` : `${chars} characters · ${lines} ${lines === 1 ? "line" : "lines"}`}
          </span>
        </p>
      </div>
    </div>
  );
}
