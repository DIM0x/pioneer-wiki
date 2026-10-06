import { describe, expect, it } from "vitest";
import type { ChronicleDetail } from "@/lib/model/types";
import { createMockServices } from "@/lib/services/mock";
import { createMockChronicleRepository } from "@/lib/services/mock/chronicles";
import { chronicleHref, chronicleListHref, readChronicleView, viewSearch } from "@/lib/chronicles/query";
import { CHRONICLE_KIND_IDS, CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";
import { chronicles } from "@/mock/chronicles";
import { entries } from "@/mock/entries";
import { members } from "@/mock/community";

describe("mock chronicle services", () => {
  it("lists the annals newest first", async () => {
    const { chronicles: repository } = createMockServices();
    const list = await repository.listChronicles();
    expect(list.map((record) => record.id)).toEqual([
      "ch-0008",
      "ch-0007",
      "ch-0006",
      "ch-0005",
      "ch-0004",
      "ch-0003",
      "ch-0002",
      "ch-0001",
    ]);
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
    expect(chronicles.map((record) => record.id)).toEqual([
      "ch-0001",
      "ch-0002",
      "ch-0003",
      "ch-0004",
      "ch-0005",
      "ch-0006",
      "ch-0007",
      "ch-0008",
    ]);
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

  it("only cites assets and members the Supabase seed will actually create", () => {
    // The seed builds its asset rows from the entry slugs plus the frontispiece,
    // so a plate living only in src/mock/assets.ts would render on mock and come
    // back empty on Supabase; hosts resolve the same way, through seeded members.
    const seededAssets = new Set([...entries.map((entry) => `plate-${entry.slug}`), "plate-frontispiece"]);
    const seededMembers = new Set(members.map((member) => member.id));
    for (const record of chronicles) {
      for (const item of record.gallery)
        expect(seededAssets, `${record.id} gallery ${item.assetId}`).toContain(item.assetId);
      for (const hostId of record.hostIds) expect(seededMembers, `${record.id} host ${hostId}`).toContain(hostId);
    }
  });
});

// ── The archive's query: search, filters and paging over the whole register ──

/** A synthetic register: `n` records a week apart, oldest first. */
function register(n: number): ChronicleDetail[] {
  return Array.from({ length: n }, (_, i) => {
    const day = new Date(Date.UTC(2020, 0, 1 + i * 7)).toISOString().slice(0, 10);
    return {
      id: `ch-${String(i + 1).padStart(4, "0")}`,
      number: i + 1,
      date: day,
      kind: CHRONICLE_KIND_IDS[i % CHRONICLE_KIND_IDS.length],
      title: { zh: `第 ${i + 1} 则`, en: `Record ${i + 1}` },
      summary: { zh: "例行记录。", en: "A routine record." },
      hostIds: i % 3 === 0 ? ["m-qingkong"] : ["m-sample-b"],
      resources: [],
      gallery: [],
      tags: [],
      sample: true,
    };
  });
}

describe("searching and filtering the annals", () => {
  const special: ChronicleDetail = {
    ...register(1)[0],
    id: "ch-0901",
    number: 901,
    date: "2026-10-05",
    title: { zh: "百分号 100% 与下划线 a_b", en: 'Wildcards: 100% (not *all*), a_b, "quoted"' },
    summary: { zh: "特殊字符。", en: "Special characters, commas and a back\\slash." },
    hostIds: ["m-sample-c"],
  };
  const sameDay: ChronicleDetail = {
    ...special,
    id: "ch-0900",
    number: 900,
    title: { zh: "同日较早", en: "Same day, filed first" },
  };

  it("finds words in either language's title and summary, and in the account alone", async () => {
    const { chronicles: repository } = createMockServices();
    const ids = async (q: string) => (await repository.listChronicles({ q })).map((record) => record.id);
    expect(await ids("纪行立项")).toEqual(["ch-0008"]);
    expect(await ids("ANNALS ARE proposed")).toEqual(["ch-0008"]);
    expect(await ids("互相指认")).toEqual(["ch-0006"]);
    expect(await ids("bilingual")).toEqual(["ch-0006", "ch-0003"]);
    // Only in ch-0006's account (its title and summary never say it).
    expect(await ids("回看中文")).toEqual(["ch-0006"]);
    expect(await ids("whoever changes the english")).toEqual(["ch-0006"]);
    // Records without an account are searched without error, and nothing matches nothing.
    expect(await ids("no such words anywhere")).toEqual([]);
    expect(await repository.countChronicles({ q: "no such words anywhere" })).toBe(0);
    // Blank words are no search at all.
    expect(await ids("   ")).toHaveLength(chronicles.length);
  });

  it("takes the words literally: no wildcards, no syntax", async () => {
    const repository = createMockChronicleRepository([special, ...register(3)]);
    const ids = async (q: string) => (await repository.listChronicles({ q })).map((record) => record.id);
    expect(await ids("100%")).toEqual(["ch-0901"]);
    expect(await ids("a_b")).toEqual(["ch-0901"]);
    expect(await ids("(not *all*)")).toEqual(["ch-0901"]);
    expect(await ids('"quoted"')).toEqual(["ch-0901"]);
    expect(await ids("back\\slash")).toEqual(["ch-0901"]);
    // `%`, `_` and `*` are not patterns: they do not stand in for other characters.
    expect(await ids("1%0")).toEqual([]);
    expect(await ids("a%b")).toEqual([]);
    expect(await ids("Rec_rd")).toEqual([]);
    expect(await ids("Rec*")).toEqual([]);
  });

  it("combines words, year, kind and member, and keeps same-day records in number order", async () => {
    const repository = createMockChronicleRepository([...register(60), sameDay, special]);
    const both = await repository.listChronicles({ year: 2026 });
    expect(both.map((record) => record.id)).toEqual(["ch-0901", "ch-0900"]);

    const query = { year: 2020, kind: ["meeting" as const], member: "m-qingkong", q: "record" };
    const found = await repository.listChronicles(query);
    expect(found.length).toBeGreaterThan(0);
    for (const record of found) {
      expect(record.date.startsWith("2020-")).toBe(true);
      expect(record.kind).toBe("meeting");
      expect(record.hostIds).toContain("m-qingkong");
    }
    expect(await repository.countChronicles(query)).toBe(found.length);
    expect(await repository.listChronicles({ ...query, member: "m-nobody" })).toEqual([]);
  });

  it("searches and counts the whole register before a page is cut, past the 200-record default", async () => {
    const records = register(260);
    records[3] = { ...records[3], body: ":::zh\n只在这一则的正文里。\n:::\n\n:::en\nOnly in this account.\n:::\n" };
    const repository = createMockChronicleRepository(records);

    // ch-0004 is the 257th newest: outside the default 200, still found.
    expect((await repository.listChronicles()).length).toBe(200);
    expect((await repository.listChronicles({ q: "only in this account" })).map((record) => record.id)).toEqual([
      "ch-0004",
    ]);
    expect(await repository.countChronicles()).toBe(260);

    // Pages follow on from each other and cover everything exactly once.
    const pages = await Promise.all(
      [0, 1, 2, 3, 4, 5, 6].map((p) => repository.listChronicles({ limit: 40, offset: p * 40 })),
    );
    const ids = pages.flat().map((record) => record.id);
    expect(ids).toHaveLength(260);
    expect(new Set(ids).size).toBe(260);
    expect(pages[6]).toHaveLength(20);

    // The facets come from the whole archive, so the oldest year is offered too.
    const facets = await repository.chronicleFacets();
    expect(facets).toMatchObject({ total: 260, samples: 260 });
    expect(facets.years).toEqual([2024, 2023, 2022, 2021, 2020]);
    expect(facets.kinds).toEqual(CHRONICLE_KIND_IDS);
    expect(facets.memberIds).toEqual(["m-qingkong", "m-sample-b"]);
  });

  it("names the neighbours in full-register order, whatever list the reader came from", async () => {
    const { chronicles: repository } = createMockServices();
    const middle = await repository.adjacentChronicles("ch-0005");
    expect([middle.older?.id, middle.newer?.id]).toEqual(["ch-0004", "ch-0006"]);
    expect((await repository.adjacentChronicles("ch-0001")).older).toBeNull();
    expect((await repository.adjacentChronicles("ch-0008")).newer).toBeNull();
    expect(await repository.adjacentChronicles("ch-9999")).toEqual({ older: null, newer: null });
  });

  it("hands out copies: lists carry no account, and nothing a caller does reaches the fixtures", async () => {
    const { chronicles: repository } = createMockServices();
    const [first] = await repository.listChronicles({ q: "立会" });
    expect(first.id).toBe("ch-0001");
    expect("body" in first).toBe(false);
    first.title.zh = "改写";
    first.hostIds.push("m-intruder");
    expect((await repository.listChronicles({ q: "立会" }))[0].title.zh).toBe("先锋维基立会");
    expect(chronicles.find((record) => record.id === "ch-0001")?.hostIds).toEqual(["m-qingkong"]);
  });
});

describe("the list view in the URL", () => {
  const known = { years: [2026, 2025], memberIds: ["m-qingkong", "m-sample-b"] };

  it("reads a clean view, keeping the old ?kind= links working", () => {
    expect(readChronicleView({})).toEqual({ page: 1 });
    expect(readChronicleView({ kind: "meeting" })).toEqual({ kind: "meeting", page: 1 });
    expect(readChronicleView({ q: "  例会  ", year: "2026", member: "m-qingkong", page: "2" }, known)).toEqual({
      q: "例会",
      year: 2026,
      member: "m-qingkong",
      page: 2,
    });
  });

  it("drops what it cannot use: malformed, unknown, blank, and the bad half of a repeated parameter", () => {
    expect(
      readChronicleView(
        { kind: ["alchemy", "archive"], year: ["20x6", "2025"], member: ["../etc", "m-sample-b"], q: ["  ", "x"] },
        known,
      ),
    ).toEqual({ kind: "archive", year: 2025, member: "m-sample-b", q: "x", page: 1 });
    expect(readChronicleView({ year: "1999", member: "m-ghost", page: "0" }, known)).toEqual({ page: 1 });
    expect(readChronicleView({ page: "-3" }).page).toBe(1);
    expect(readChronicleView({ page: "2.5" }).page).toBe(1);
    expect(readChronicleView({ q: "x".repeat(500) }).q).toHaveLength(80);
  });

  it("writes canonical links: fixed order, no empty parameters, back to page one when the view changes", () => {
    const view = readChronicleView({ q: "a b&c", kind: "meeting", year: "2026", page: "3" });
    expect(chronicleListHref(view, { page: 3 })).toBe("/chronicles?q=a+b%26c&year=2026&kind=meeting&page=3");
    expect(chronicleListHref(view, { kind: undefined })).toBe("/chronicles?q=a+b%26c&year=2026");
    expect(chronicleListHref(view, { member: "m-qingkong" })).toBe(
      "/chronicles?q=a+b%26c&year=2026&kind=meeting&member=m-qingkong",
    );
    expect(chronicleListHref({ page: 1 })).toBe("/chronicles");
    // A record's link carries the view, so its way back returns to the same list.
    expect(chronicleHref("ch-0004", view)).toBe("/chronicles/ch-0004?q=a+b%26c&year=2026&kind=meeting&page=3");
    expect(chronicleHref("ch-0004")).toBe("/chronicles/ch-0004");
    // Reading a written link gives the same view back.
    expect(readChronicleView(Object.fromEntries(new URLSearchParams(viewSearch(view))))).toEqual(view);
  });
});
