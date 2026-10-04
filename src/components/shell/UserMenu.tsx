"use client";

import Link from "next/link";
import type { Author } from "@/lib/model/types";
import { useI18n } from "@/lib/i18n/client";
import { AuthorSigil } from "@/components/archive/AuthorSigil";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ user }: { user: Author | null }) {
  const { t, pick } = useI18n();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-full" aria-label={`${t("user.menu")} — ${pick(user.name)}`}>
        <AuthorSigil seed={user.sigil} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-small text-ink">{pick(user.name)}</span>
          <span className="font-mono text-meta font-normal text-ink-3">@{user.handle}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/search?status=draft&author=${user.id}`}>{t("user.drafts")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/search?status=in_review">{t("user.reviews")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>{t("user.signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
