import { describe, expect, it, vi } from "vitest";
import { captureReadingPosition, restoreReadingPosition } from "@/lib/reading/position";

function element(top: number, height: number, isConnected = true) {
  return {
    isConnected,
    getBoundingClientRect: () => ({ top, bottom: top + height, height }),
  } as Element;
}

function documentWith(elements: Element[]) {
  return { querySelectorAll: () => elements } as unknown as Document;
}

describe("reading position across layout changes", () => {
  it("skips hidden figures and paragraphs above the reading bar, preserving the visible paragraph", () => {
    const paragraph = element(160, 120);
    const position = captureReadingPosition(documentWith([element(0, 0), element(-100, 120), paragraph]), 800);
    const scrollBy = vi.fn();
    paragraph.getBoundingClientRect = () => ({ top: 320, height: 150 }) as DOMRect;
    restoreReadingPosition(position, { scrollBy });
    expect(scrollBy).toHaveBeenCalledWith({ top: 160, behavior: "instant" });
  });

  it("keeps a partially visible paragraph below the bar", () => {
    const paragraph = element(-80, 300);
    const position = captureReadingPosition(documentWith([paragraph]), 800);
    const scrollBy = vi.fn();
    paragraph.getBoundingClientRect = () => ({ top: 210, height: 300 }) as DOMRect;
    restoreReadingPosition(position, { scrollBy });
    expect(scrollBy).toHaveBeenCalledWith({ top: 122, behavior: "instant" });
  });

  it("leaves the title position alone when no body text is in view", () => {
    expect(captureReadingPosition(documentWith([element(900, 100)]), 800)).toBeNull();
    const scrollBy = vi.fn();
    restoreReadingPosition(null, { scrollBy });
    restoreReadingPosition({ element: element(200, 100, false), top: 120 }, { scrollBy });
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
