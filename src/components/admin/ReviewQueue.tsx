"use client";

import { useState } from "react";
import type { EntrySummary, Revision } from "@/lib/model/types";

type Item = { entry: EntrySummary; revisions: Revision[] };

export function ReviewQueue({ items }: { items: Item[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function transition(entryId: string, action: "publish" | "rollback", targetRevisionId?: string) {
    setBusy(`${entryId}:${action}`); setMessage("");
    try {
      const response = await fetch(`/api/entries/${encodeURIComponent(entryId)}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, targetRevisionId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? `HTTP ${response.status}`);
      setMessage(action === "publish" ? "已发布。" : "已回滚。"); window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(null); }
  }
  return <div className="flex flex-col gap-5">
    {items.length === 0 ? <p className="text-small text-ink-3">当前没有待审核条目。</p> : items.map(({ entry, revisions }) => {
      const target = revisions.find((revision) => revision.state === "published");
      return <article key={entry.id} className="pw-sheet flex flex-col gap-4 p-5">
        <div><p className="font-mono text-meta text-ink-3">{entry.id} · {entry.slug}</p><h2 className="mt-1 font-display text-h3">{entry.title.zh} <span className="text-ink-3">· {entry.title.en}</span></h2><p className="mt-2 text-small text-ink-2">{entry.summary.zh}</p></div>
        <div className="flex flex-wrap items-center gap-3 text-small"><span>最新版本 r{entry.revision}</span><span className="text-ink-3">{revisions[0]?.note}</span><button type="button" disabled={Boolean(busy)} onClick={() => void transition(entry.id, "publish")} className="rounded-sm bg-ink px-3 py-2 text-paper-sheet disabled:opacity-50">{busy === `${entry.id}:publish` ? "处理中…" : "发布"}</button>{target ? <button type="button" disabled={Boolean(busy)} onClick={() => void transition(entry.id, "rollback", target.id)} className="rounded-sm border border-rule-strong px-3 py-2 disabled:opacity-50">回滚到 r{target.number}</button> : null}</div>
      </article>;
    })}
    {message ? <p role="status" className="text-small text-ink-2">{message}</p> : null}
  </div>;
}
