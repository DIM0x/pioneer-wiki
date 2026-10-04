import { describe, expect, it } from "vitest";
import { createMockServices } from "@/lib/services/mock";

describe("mock wiki services", () => {
  it("lists and searches entries with filters", async () => {
    const services = createMockServices();
    const entries = await services.entries.listEntries({ featured: true });
    expect(entries.length).toBeGreaterThan(0);
    const result = await services.search.search({ text: "memory", filters: { scale: ["macro"] } });
    expect(result.hits.some((hit) => hit.entry.slug === "memory-hierarchy")).toBe(true);
  });

  it("stores draft bodies and applies review transitions", async () => {
    const services = createMockServices();
    const draft = await services.entries.saveDraft({ entryId: "PW-0010", title: { zh: "布隆过滤器", en: "Bloom filter" }, summary: { zh: "草稿", en: "Draft" }, body: "draft body", note: "test draft", authorId: "a-qingkong" });
    expect(await services.entries.getRevisionBody(draft.id)).toBe("draft body");
    const submitted = await services.entries.transition({ entryId: "PW-0010", action: "submit", actorId: "a-qingkong" });
    expect(submitted.state).toBe("in_review");
    const published = await services.entries.transition({ entryId: "PW-0010", action: "publish", actorId: "a-qingkong" });
    expect(published.state).toBe("published");
  });

  it("rejects invalid lifecycle transitions", async () => {
    const services = createMockServices();
    await expect(services.entries.transition({ entryId: "PW-0001", action: "publish", actorId: "a-qingkong" })).rejects.toMatchObject({ code: "conflict" });
  });
});
