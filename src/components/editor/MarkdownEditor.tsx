"use client";

import { useCallback, useEffect, useState } from "react";
import type { DomainId, Localized, ReviewState, Revision } from "@/lib/model/types";
import { DOMAINS, DOMAIN_IDS } from "@/lib/model/vocab";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown/Markdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/archive/StatusBadge";
import { KeyboardHint } from "@/components/archive/KeyboardHint";
import { NotebookSheet } from "@/components/writing/NotebookSheet";

interface MarkdownEditorProps {
  initial: { title: Localized; summary: Localized; body: string; state: ReviewState };
  /** Existing entry being edited; omitted for a new entry (assigned on first save). */
  entryId?: string;
  /** Revision number being edited from; omitted for a new entry. */
  baseRevision?: number;
}

type Feedback = { kind: "ok" | "error"; text: string } | null;

async function post<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return json as T;
}

/**
 * Two facing pages: a field-notebook pad on the left (NotebookSheet), the
 * printer's proof on the right. Save draft → POST /api/drafts; submit →
 * POST /api/entries/[id]/transition.
 */
export function MarkdownEditor({ initial, entryId: initialEntryId, baseRevision }: MarkdownEditorProps) {
  const { t, lang } = useI18n();
  const [titleEn, setTitleEn] = useState(initial.title.en);
  const [titleZh, setTitleZh] = useState(initial.title.zh);
  const [body, setBody] = useState(initial.body);
  const [note, setNote] = useState("");
  const [pane, setPane] = useState<"write" | "preview">("write");
  const [entryId, setEntryId] = useState(initialEntryId);
  const [domain, setDomain] = useState<DomainId>("algorithms");
  const [state, setState] = useState<ReviewState>(initial.state);
  const [revision, setRevision] = useState(baseRevision);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const saveDraft = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const rev = await post<Revision>("/api/drafts", {
        entryId,
        domain: entryId ? undefined : domain,
        title: { zh: titleZh, en: titleEn },
        summary: initial.summary,
        body,
        note: note || (lang === "zh" ? "保存草稿" : "Save draft"),
        baseRevision: revision,
      });
      setEntryId(rev.entryId);
      setState(rev.state);
      setRevision(rev.number);
      setNote("");
      setFeedback({ kind: "ok", text: `${t("editor.saveDraft")} · r${rev.number}` });
    } catch (e) {
      setFeedback({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, entryId, domain, titleZh, titleEn, initial.summary, body, note, lang, t, revision]);

  const submit = useCallback(async () => {
    if (busy || !entryId) return;
    setBusy(true);
    setFeedback(null);
    try {
      const rev = await post<Revision>(`/api/entries/${encodeURIComponent(entryId)}/transition`, { action: "submit", note: note || undefined });
      setState(rev.state);
      setRevision(rev.number);
      setFeedback({ kind: "ok", text: `${t("editor.submit")} · r${rev.number}` });
    } catch (e) {
      setFeedback({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, entryId, note, t]);

  // Ctrl/⌘-S saves a draft from anywhere in the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveDraft();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft]);

  return (
    <div className="flex flex-col gap-(--space-block)">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-small tracking-[0.14em] text-ink-2 uppercase">{t("editor.title.en")}</span>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} lang="en" placeholder="Gossip protocol" className="pw-field font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-tight tracking-[-0.02em]" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-small tracking-[0.14em] text-ink-2">{t("editor.title.zh")}</span>
          <input value={titleZh} onChange={(e) => setTitleZh(e.target.value)} lang="zh-CN" placeholder="流言协议" className="pw-field font-display text-h3" />
        </label>
        {/* A new entry files into one of the ten phyla; once the entry exists its phylum is fixed. */}
        {!entryId ? (
          <label className="flex max-w-xs flex-col gap-1.5">
            <span className="font-mono text-small tracking-[0.14em] text-ink-2">{t("editor.domain")}</span>
            <Select value={domain} onValueChange={(v) => setDomain(v as DomainId)}>
              <SelectTrigger className="pw-field h-9 w-full rounded-none border-0 px-0 text-small shadow-none focus-visible:border-0 focus-visible:ring-0 [&>svg]:text-ink-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {DOMAIN_IDS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DOMAINS[d][lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>

      {/* Small screens: one pane at a time. */}
      <div role="tablist" aria-label={`${t("editor.write")} / ${t("editor.preview")}`} className="flex gap-5 border-b border-rule lg:hidden">
        {(["write", "preview"] as const).map((p) => (
          <button
            key={p}
            role="tab"
            type="button"
            aria-selected={pane === p}
            onClick={() => setPane(p)}
            className={cn("-mb-px border-b py-2 text-small", pane === p ? "border-brick text-ink" : "border-transparent text-ink-3")}
          >
            {t(p === "write" ? "editor.write" : "editor.preview")}
          </button>
        ))}
      </div>

      <div className="grid gap-(--space-block) lg:grid-cols-2">
        <NotebookSheet
          value={body}
          onChange={setBody}
          lang={lang}
          mono
          label={lang === "zh" ? "田野笔记 · 撰写" : "Field notes · Writing"}
          head={[
            [lang === "zh" ? "编号" : "No.", entryId ?? (lang === "zh" ? "新条目" : "new")],
            ...(entryId ? [] : ([[lang === "zh" ? "门" : "Phylum", DOMAINS[domain][lang]]] as [string, string][])),
            [lang === "zh" ? "年轮" : "Ring", revision ? `r${revision}` : "r1"],
            [lang === "zh" ? "日期" : "Date", today],
          ]}
          hint={lang === "zh" ? "Markdown · 双语块 :::zh / :::en · 标题 ## 中文 | English" : "Markdown · bilingual blocks :::zh / :::en · headings ## 中文 | English"}
          className={cn("min-h-[64vh]", pane !== "write" && "max-lg:hidden")}
        />
        <section aria-label={t("editor.preview")} className={cn("relative", pane !== "preview" && "max-lg:hidden")}>
          <div className="pw-proof min-h-[64vh] px-6 pt-14 pb-10 sm:px-12">
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <p aria-hidden="true" className="absolute top-4 right-5 left-6 flex items-center justify-between font-mono text-[0.625rem] tracking-[0.18em] text-ink-3 uppercase sm:left-12">
              <span>{lang === "zh" ? "校样" : "Proof"} · {entryId ?? "PW-new"}</span>
              <span className="pw-stamp normal-case">{lang === "zh" ? "未付印" : "Not for press"}</span>
            </p>
            <h2 className="mb-8 font-display">
              <span className="block text-h1 leading-none font-[480] tracking-[-0.02em]">{titleEn}</span>
              <span lang="zh-CN" className="mt-2 block text-h4 font-normal text-ink-3">
                {titleZh}
              </span>
            </h2>
            <Markdown lang={lang}>{body}</Markdown>
          </div>
        </section>
      </div>

      <div aria-busy={busy || undefined} className="pw-ink-over sticky bottom-0 z-10 -mx-4 flex flex-wrap items-end gap-4 bg-paper/95 px-4 pb-4 sm:-mx-6 sm:px-6">
        <StatusBadge state={state} lang={lang} showForm />
        {revision ? <span className="font-mono text-meta text-ink-3">r{revision}</span> : null}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="sr-only">{t("editor.note")}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("editor.notePlaceholder")} className="pw-field h-9 text-small" />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !entryId || state !== "draft"}
            className="h-9 rounded-sm border border-rule-strong px-3 text-small text-ink hover:bg-ink/5 disabled:opacity-45"
          >
            {t("editor.submit")}
          </button>
          <button type="button" onClick={saveDraft} disabled={busy} className="h-9 rounded-sm bg-ink px-4 text-small text-paper-sheet hover:bg-ink-2 disabled:opacity-45">
            {t("editor.saveDraft")}
          </button>
          <KeyboardHint keys={["Ctrl", "S"]} className="hidden sm:inline-flex" />
        </div>
        <p role={feedback?.kind === "error" ? "alert" : "status"} className={cn("w-full text-meta", feedback?.kind === "error" ? "text-brick-ink" : "text-ink-3")}>
          {feedback?.text ?? ""}
        </p>
      </div>
    </div>
  );
}
