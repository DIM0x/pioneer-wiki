/**
 * 书眉 — the running head at the top of every book page: where you are on the
 * left, the folio on the right. Letterpress small capitals over a hand-inked rule.
 */
export function RunningHead({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="pw-ink-under pw-smallcaps flex items-baseline justify-between gap-6 text-small text-ink-2">
      <span className="min-w-0 truncate">{left}</span>
      {right ? <span className="shrink-0 text-ink-3">{right}</span> : null}
    </div>
  );
}
