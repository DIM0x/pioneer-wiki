import { NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { adminAccountOrResponse } from "@/lib/auth/admin";

export async function GET() {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const entries = await getServices().entries.listEntries({ status: ["in_review"] });
  return NextResponse.json({ entries });
}
