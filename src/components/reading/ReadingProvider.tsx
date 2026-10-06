"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { captureReadingPosition, restoreReadingPosition } from "@/lib/reading/position";
import { READING_COOKIE } from "@/lib/reading/preference";

const ReadingContext = createContext<{ textOnly: boolean; setTextOnly: (next: boolean) => void } | null>(null);

/** A book-wide preference; only pages marked as reading surfaces use it. */
export function ReadingProvider({
  initialTextOnly,
  children,
}: {
  initialTextOnly: boolean;
  children: React.ReactNode;
}) {
  const [textOnly, setState] = useState(initialTextOnly);
  const setTextOnly = useCallback((next: boolean) => {
    const position = captureReadingPosition(document, window.innerHeight);
    document.documentElement.dataset.reading = next ? "text" : "illustrated";
    document.cookie = `${READING_COOKIE}=${next ? "text" : "illustrated"}; path=/; max-age=31536000; samesite=lax`;
    setState(next);
    requestAnimationFrame(() => restoreReadingPosition(position, window));
    if (!next && document.fullscreenElement?.hasAttribute("data-reading-fullscreen")) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);
  const value = useMemo(() => ({ textOnly, setTextOnly }), [textOnly, setTextOnly]);
  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const value = useContext(ReadingContext);
  if (!value) throw new Error("useReading must be used inside ReadingProvider");
  return value;
}
