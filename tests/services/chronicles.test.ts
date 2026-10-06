import { describe, expect, it } from "vitest";
import { createMockServices } from "@/lib/services/mock";
import { CHRONICLE_KIND_IDS, CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";
import { chronicles } from "@/mock/chronicles";

describe("mock chronicle services", () => {
  it("lists the annals newest first", async () => {
    const { chronicles: repository } = createMockServices();
    const list = await repository.listChronicles();
    expect(list.map((record) => record.id)).toEqual(["ch-0008", "ch-0007", "ch-0006", "ch-0005", "ch-0004", "ch-0003", "ch-0002", "ch-0001"]);
    const dates = list.map((record) => record.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("filters by kind, year and limit without disturbing the fixtures", async () => {
    const { chronicles: repository } = createMockServices();
    const meetings = await repository.listChronicles({ kind: ["meeting"] });
    expect(meetings.length).toBeGreaterThan(0);
    expect(meetings.every((record) => record.kind === "meeting")).toBe(true);
    expect(meetings.map((record) => record.id)).toEqual(["ch-0008", "ch-0006", "ch-0004", "ch-0002"]);

    expect((await repository.listChronicles({ year: 2026 })).length).toBe(chronicles.length);
    expect(await repository.listChronicles({ year: 2025 })).toEqual([]);

    const limited = await repository.listChronicles({ limit: 3 });
    expect(limited.map((record) => record.id)).toEqual(["ch-0008", "ch-0007", "ch-0006"]);

    // Reading never reorders or rewrites the fixture list itself.
    expect(chronicles.map((record) => record.id)).toEqual(["ch-0001", "ch-0002", "ch-0003", "ch-0004", "ch-0005", "ch-0006", "ch-0007", "ch-0008"]);
  });

  it("hands out one record's account, and null for anything unknown", async () => {
    const { chronicles: repository } = createMockServices();
    const found = await repository.getChronicle("ch-0001");
    expect(found).toMatchObject({ kind: "milestone", number: 1, sample: true });
    expect(found?.body).toContain(":::zh");
    expect(await repository.getChronicle("ch-9999")).toBeNull();
  });
});

describe("chronicle fixtures", () => {
  it("is a well-formed register: unique ids and contiguous numbers", () => {
    const ids = chronicles.map((record) => record.id);
    expect(new Set(ids).size).toBe(chronicles.length);
    expect(ids.every((id) => /^ch-\d{4}$/.test(id))).toBe(true);
    const numbers = chronicles.map((record) => record.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: chronicles.length }, (_, i) => i + 1));
    const dates = chronicles.map((record) => record.date);
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
  });

  it("is bilingual and uses only known kinds", () => {
    for (const record of chronicles) {
      expect(record.title.zh, `${record.id} title.zh`).not.toBe("");
      expect(record.title.en, `${record.id} title.en`).not.toBe("");
      expect(record.summary.zh, `${record.id} summary.zh`).not.toBe("");
      expect(record.summary.en, `${record.id} summary.en`).not.toBe("");
      expect(CHRONICLE_KIND_IDS).toContain(record.kind);
    }
  });

  it("links every recording and document to an http(s) address", () => {
    for (const record of chronicles) {
      for (const resource of record.resources) {
        expect(Object.keys(CHRONICLE_RESOURCE_KINDS)).toContain(resource.kind);
        expect(resource.url, `${record.id} ${resource.label.en}`).toMatch(/^https?:\/\//);
        expect(resource.label.zh).not.toBe("");
        expect(resource.label.en).not.toBe("");
      }
    }
  });

  it("points every plate at a registered asset, so credit and licence are never missing", async () => {
    const { references } = createMockServices();
    const used = chronicles.flatMap((record) => record.gallery.map((item) => item.assetId));
    expect(used.length).toBeGreaterThan(0);
    for (const assetId of used) {
      const asset = await references.getAsset(assetId);
      expect(asset, assetId).not.toBeNull();
      expect(asset?.credit).not.toBe("");
      expect(asset?.license).not.toBe("");
    }
  });

  it("is still placeholder data, stamped as such", () => {
    expect(chronicles.every((record) => record.sample === true)).toBe(true);
  });
});
