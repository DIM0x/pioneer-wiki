/*
 * Which list a record was opened from, kept for the life of the tab's script
 * (never stored). When the reader opened this very record from that list, the
 * record's "back" link can step back through history instead, so the browser
 * puts the list back where it was scrolled to.
 */

let opened: { list: string; record: string } | null = null;

export function rememberOpened(list: string, record: string) {
  opened = { list, record };
}

/** True once, for the record that was opened from this list; reading it forgets it. */
export function takeOpened(list: string, record: string): boolean {
  const match = opened?.list === list && opened.record === record;
  if (match) opened = null;
  return match;
}
