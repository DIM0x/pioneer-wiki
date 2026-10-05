import { NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: RouteContext<"/api/admin/entries/[id]/archive">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  if (!getSupabaseConfig()) return NextResponse.json({ error: { code: "unavailable", message: "Archiving requires Supabase." } }, { status: 503 });
  const { id } = await params;
  const client = await createSupabaseServerClient();
  const before = await client.from("entries").select("*").eq("id", id).maybeSingle();
  if (before.error || !before.data) return NextResponse.json({ error: { code: "not_found", message: "No such entry" } }, { status: 404 });
  const { data, error } = await client.from("entries").update({ deleted_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: { code: "unavailable", message: error.message } }, { status: 503 });
  await client.rpc("pw_audit_insert", { p_action: "archive", p_object_type: "entry", p_object_id: id, p_before: before.data, p_after: data });
  return NextResponse.json(data);
}
