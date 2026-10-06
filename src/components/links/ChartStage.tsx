"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * The hand on the map: pointing at a territory or its line in the index
 * marks every element carrying the same `data-slot` with `data-on` (its card
 * opens, its name is underlined) and sets `--lit-<slot>` on the stage, which
 * the territory's wash inside the shared <use> drawing reads to deepen. On
 * touch screens the first tap on a territory opens its card and the second
 * follows the link. The map itself is printed on the server; this only sets
 * attributes on what is already there.
 */
export function ChartStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const touch = useRef(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<Element>("[data-slot]").forEach((el) => {
      el.toggleAttribute("data-on", el.getAttribute("data-slot") === active);
    });
    if (active === null) return;
    root.style.setProperty(`--lit-${active}`, "1");
    return () => {
      root.style.removeProperty(`--lit-${active}`);
    };
  }, [active]);

  useEffect(() => {
    if (active === null) return;
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node))
        setActive(null);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("pointerdown", close);
    };
  }, [active]);

  const slotOf = (target: EventTarget | null) =>
    target instanceof Element ? (target.closest("[data-slot]")?.getAttribute("data-slot") ?? null) : null;

  return (
    <div
      ref={ref}
      className={className}
      onPointerDown={(e) => (touch.current = e.pointerType !== "mouse")}
      onPointerOver={(e) => e.pointerType === "mouse" && setActive(slotOf(e.target))}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      onFocus={(e) => setActive(slotOf(e.target))}
      onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node | null) && setActive(null)}
      onClick={(e) => {
        const territory = e.target instanceof Element ? e.target.closest("[data-territory]") : null;
        const slot = slotOf(territory);
        if (!territory || slot === null || !touch.current || active === slot) return;
        e.preventDefault();
        setActive(slot);
      }}
    >
      {children}
    </div>
  );
}
