import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberProject } from "@/lib/model/types";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
import { createSupabaseServices } from "@/lib/services/supabase";

const work: MemberProject = {
  id: "work",
  url: "https://example.org/work",
  title: "My work",
  description: "A project",
  tags: ["Web"],
  links: [],
};
const member = { id: "m", handle: "qingkong", name_zh: "青空", name_en: "Qingkong", plate_number: 1, projects: [work] };

describe("Supabase selected works contract (stubbed database)", () => {
  beforeEach(() => vi.resetAllMocks());
  function database(row: Record<string, unknown>) {
    const query = {
      update: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    query.update.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
    return query;
  }
  it("writes normalized projects and maps the resulting member", async () => {
    const query = database(member);
    const next = await createSupabaseServices().community.updateMember("qingkong", {
      projects: [{ ...work, title: "  My work  " }],
    });
    expect(query.update).toHaveBeenCalledWith({ projects: [work] });
    expect(next?.projects).toEqual([work]);
    expect(query.eq).toHaveBeenCalledWith("handle", "qingkong");
  });
  it("rejects unsafe writes before sending an update", async () => {
    const query = database(member);
    await expect(
      createSupabaseServices().community.updateMember("qingkong", {
        projects: [{ ...work, url: "javascript:alert(1)" }],
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    expect(query.update).not.toHaveBeenCalled();
  });
  it("keeps older records readable and excludes unchecked poisoned links from public reads", async () => {
    database({ ...member, projects: undefined });
    expect((await createSupabaseServices().community.getMember("qingkong"))?.projects).toEqual([]);
    database({ ...member, projects: [{ ...work, links: [{ label: "bad", url: "javascript:alert(1)" }] }] });
    expect((await createSupabaseServices().community.getMember("qingkong"))?.projects).toEqual([]);
  });
});
