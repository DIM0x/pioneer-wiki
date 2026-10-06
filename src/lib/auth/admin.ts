import "server-only";
import { NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import type { Account } from "@/lib/model/types";

/** A verified administrator, or the response that ends the request. */
export async function adminAccountOrResponse(): Promise<{ account: Account } | { response: NextResponse }> {
  const account = await getServices().auth.getCurrentAccount();
  if (!account)
    return {
      response: NextResponse.json({ error: { code: "forbidden", message: "Sign in to continue." } }, { status: 401 }),
    };
  if (!account.emailVerified)
    return {
      response: NextResponse.json(
        { error: { code: "email_not_verified", message: "Verify your email first." } },
        { status: 403 },
      ),
    };
  if (account.role !== "admin")
    return {
      response: NextResponse.json(
        { error: { code: "forbidden", message: "Administrator access is required." } },
        { status: 403 },
      ),
    };
  return { account };
}
