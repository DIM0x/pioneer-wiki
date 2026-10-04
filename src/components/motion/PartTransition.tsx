"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Below the entrance stage, the content of one part gives way to the next with
 * a short fade and rise (`.pw-swap`) while the stage above plays its frames.
 */
export function PartTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="pw-swap" exit="pw-swap" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
