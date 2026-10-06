import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ ownerOf: vi.fn(), importProjectPreview: vi.fn() }));
vi.mock("@/lib/members/owner", () => ({ ownerOf: mocks.ownerOf }));
vi.mock("@/lib/members/preview", () => ({ importProjectPreview: mocks.importProjectPreview }));
import { POST } from "@/app/api/members/[handle]/project-preview/route";

const request = (url = "https://example.org/") =>
  new NextRequest("https://wiki.example/api/members/qingkong/project-preview", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
const context = { params: Promise.resolve({ handle: "qingkong" }) };

describe("owner-only project preview import", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.ownerOf.mockResolvedValue(null);
  });
  it("denies visitors before any outbound request", async () => {
    mocks.ownerOf.mockResolvedValue(NextResponse.json({ error: "forbidden" }, { status: 403 }));
    expect((await POST(request(), context)).status).toBe(403);
    expect(mocks.importProjectPreview).not.toHaveBeenCalled();
  });
  it("returns a preview without saving the member page", async () => {
    mocks.importProjectPreview.mockResolvedValue({ title: "A project" });
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ title: "A project" });
    expect(mocks.importProjectPreview).toHaveBeenCalledWith("https://example.org/");
  });
  it("contains malformed URL and remote errors without leaking diagnostics", async () => {
    expect((await POST(request("file:///private"), context)).status).toBe(422);
    expect(mocks.importProjectPreview).not.toHaveBeenCalled();
    mocks.importProjectPreview.mockRejectedValue(new Error("private internal details"));
    const response = await POST(request(), context);
    expect(response.status).toBe(422);
    expect(JSON.stringify(await response.json())).not.toContain("internal details");
  });
});
