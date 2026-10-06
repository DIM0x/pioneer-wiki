import "server-only";
import { NextResponse } from "next/server";
import type { TaxonKind } from "@/lib/model/types";
import { ServiceError } from "@/lib/services/contracts";

export const isTaxonKind = (value: string): value is TaxonKind => value === "family" || value === "category";

const CODES = new Set(["unavailable", "conflict", "forbidden", "invalid"]);

/**
 * A ServiceError by shape, not by class: in development the service graph is
 * kept on globalThis across reloads, so its errors may come from an earlier
 * copy of the module and fail `instanceof`.
 */
const asServiceError = (error: unknown): ServiceError | null =>
  error instanceof ServiceError
    ? error
    : error instanceof Error && error.name === "ServiceError" && CODES.has(String((error as ServiceError).code))
      ? (error as ServiceError)
      : null;

/** The HTTP answer for a failed taxonomy write. */
export function taxonomyError(error: unknown) {
  const e = asServiceError(error) ?? new ServiceError("invalid", "Invalid taxonomy request");
  const status = { forbidden: 403, conflict: 409, unavailable: 503, invalid: 422 }[e.code];
  return NextResponse.json({ error: { code: e.code, message: e.message } }, { status });
}

export const unknownKind = () =>
  NextResponse.json({ error: { code: "invalid", message: "Unknown taxon kind." } }, { status: 422 });
