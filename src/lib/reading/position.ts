interface ReadingPosition {
  element: Element;
  top: number;
}

/** Keep the first visible paragraph/heading in place as the facing page folds away. */
export function captureReadingPosition(root: Document, viewportHeight: number): ReadingPosition | null {
  const elements = root.querySelectorAll("[data-reading-page] .pw-prose :is(p, h2, h3, pre, li)");
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.height && rect.bottom > 88 && rect.top < viewportHeight) {
      return { element, top: Math.max(88, rect.top) };
    }
  }
  return null;
}

export function restoreReadingPosition(position: ReadingPosition | null, viewport: Pick<Window, "scrollBy">) {
  if (!position?.element.isConnected) return;
  const rect = position.element.getBoundingClientRect();
  if (!rect.height) return;
  viewport.scrollBy({ top: rect.top - position.top, behavior: "instant" });
}
