"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { rememberOpened, takeOpened } from "./return-memory";

const plainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** A record's title in the list; remembers the list it was opened from. */
export function ChronicleRowLink({
  href,
  list,
  className,
  children,
}: {
  href: string;
  list: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={(e) => plainClick(e) && rememberOpened(list, href)}>
      {children}
    </Link>
  );
}

/**
 * Back to the list, with its words and filters. Opened straight from that list,
 * it steps back through history so the list returns at the reading position;
 * reached any other way (a shared link, a neighbouring record) it is a plain link.
 */
export function ChronicleBackLink({
  href,
  record,
  className,
  children,
}: {
  href: string;
  record: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      transitionTypes={["nav-back"]}
      className={className}
      onClick={(e) => {
        if (plainClick(e) && takeOpened(href, record)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
