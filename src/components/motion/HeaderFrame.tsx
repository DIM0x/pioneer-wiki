"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The running header's behaviour: transparent on the open page, a paper band
 * with a hairline once the reader scrolls, tucked away while reading down and
 * back as soon as they scroll up.
 */
export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last.current) > 6) {
        setHidden(y > last.current && y > 240 && !document.querySelector("[data-header-pin]"));
        last.current = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      data-reading-shell
      data-scrolled={scrolled || undefined}
      data-hidden={hidden || undefined}
      style={{ viewTransitionName: "site-header" }}
      className="group/header sticky top-0 z-(--z-header) border-b border-transparent transition-[transform,background-color,border-color] duration-(--dur-slow) ease-(--ease-grow) focus-within:translate-y-0 data-hidden:-translate-y-full data-scrolled:border-rule data-scrolled:bg-paper/90 data-scrolled:backdrop-blur-[3px]"
    >
      {children}
    </header>
  );
}
