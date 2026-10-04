import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { ServiceError, type NewThreadInput } from "@/lib/services/contracts";
import type { ForumCategory } from "@/lib/model/types";

const status = (e: ServiceError) => (e.code === "forbidden" ? 403 : e.code === "conflict" ? 409 : e.code === "unavailable" ? 503 : 422);

/** GET /api/forum/threads?category=&limit= → ForumThread[] (most recently active first). */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const threads = await getServices().community.listThreads({
    category: (p.get("category") as ForumCategory | null) ?? undefined,
    limit: p.has("limit") ? Number(p.get("limit")) : undefined,
  });
  return NextResponse.json(threads);
}

/** POST /api/forum/threads { title, body, category, authorName? } → ForumThread (201). */
export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as Partial<NewThreadInput>;
    const { auth, community } = getServices();
    const user = await auth.getCurrentUser();
    const members = await community.listMembers();
    const member = user ? members.find((m) => m.authorId === user.id) : undefined;
    const thread = await community.createThread({
      title: input.title ?? "",
      body: input.body ?? "",
      category: input.category ?? "general",
      authorName: input.authorName?.trim() || member?.name.zh || "",
      memberId: input.authorName?.trim() ? undefined : member?.id,
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    const e = error instanceof ServiceError ? error : new ServiceError("invalid", "Invalid thread payload");
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: status(e) });
  }
}
