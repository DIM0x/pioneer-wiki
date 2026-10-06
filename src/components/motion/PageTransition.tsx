"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { PARTS } from "@/lib/parts";

const ENTRANCE = new Set<string>(PARTS.map((p) => p.href));

/**
 * Route changes turn the page: the new page is uncovered by a wipe from the
 * fore-edge while the old one sinks back (styles/motion.css, `.pw-page`).
 * Links tagged `transitionTypes={["nav-back"]}` turn the other way. Changes
 * inside one route (query strings, language refresh) do not turn the page,
 * and neither does moving between the five parts at the entrance — there the
 * stage itself turns (EntranceStage) and only the part content swaps.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const turn = { "nav-back": "pw-page-back", default: "pw-page" };
  return (
    <ViewTransition key={ENTRANCE.has(pathname) ? "entrance" : pathname} enter={turn} exit={turn} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
