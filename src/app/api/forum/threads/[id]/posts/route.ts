import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { ServiceError } from "@/lib/services/contracts";

/** POST /api/forum/threads/[id]/posts { body, authorName? } → ForumPost (201); 404 when the thread does not exist. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/forum/threads/[id]/posts">) {
  try {
    const { id } = await params;
    const input = (await request.json()) as { body?: string; authorName?: string };
    const { auth, community } = getServices();
    const user = await auth.getCurrentUser();
    const member = user ? (await community.listMembers()).find((m) => m.authorId === user.id) : undefined;
    const post = await community.reply({
      threadId: id,
      body: input.body ?? "",
      authorName: input.authorName?.trim() || member?.name.zh || "",
      memberId: input.authorName?.trim() ? undefined : member?.id,
    });
    if (!post) return NextResponse.json({ error: { code: "not_found", message: "No such thread" } }, { status: 404 });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const e = error instanceof ServiceError ? error : new ServiceError("invalid", "Invalid post payload");
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.code === "invalid" ? 422 : 503 });
  }
}
