import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { createMockServices } from "@/lib/services/mock";
import { DOMAIN_IDS } from "@/lib/model/vocab";
import { LEGACY_DOMAINS } from "@/lib/taxonomy/legacy";

vi.mock("server-only", () => ({}));
// sharp keeps decoded files open in its cache, which on Windows blocks removing the temp folder.
sharp.cache(false);

// Route handlers read the services through getServices(); give them a fresh mock graph.
const services = createMockServices();
vi.mock("@/lib/services", () => ({ getServices: () => services }));

describe("old /domains/<phylum> links", () => {
  const get = async (domain: string) => {
    const { GET } = await import("@/app/domains/[domain]/route");
    return GET(new NextRequest(`http://wiki.test/domains/${domain}`), {
      params: Promise.resolve({ domain }),
    } as never);
  };

  it("answer every phylum with a permanent 308 to its family or genus", async () => {
    for (const domain of DOMAIN_IDS) {
      const target = LEGACY_DOMAINS[domain];
      const res = await get(domain);
      expect(res.status, domain).toBe(308);
      expect(new URL(res.headers.get("location") ?? "").pathname, domain).toBe(
        `/${target.kind === "family" ? "families" : "categories"}/${target.id}`,
      );
    }
  });

  it("follow a renamed genus to its current slug", async () => {
    await services.taxonomy.saveTaxon({
      kind: "category",
      id: "distributed-systems",
      patch: { slug: "distributed-computing" },
      note: "rename",
    });
    const res = await get("distributed");
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/categories/distributed-computing");
  });

  it("send an unknown phylum to the contents", async () => {
    const res = await get("alchemy");
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location") ?? "").hash).toBe("#contents");
  });
});

describe("the catalogue plate gate", () => {
  let pkg: string;
  let cwd: string;

  /** A plate on flat paper with a dark blot in the middle. */
  const plate = (file: string, ground: [number, number, number]) =>
    sharp({ create: { width: 120, height: 80, channels: 3, background: { r: ground[0], g: ground[1], b: ground[2] } } })
      .composite([
        { input: Buffer.from('<svg width="120" height="80"><circle cx="60" cy="40" r="18" fill="#3a3326"/></svg>') },
      ])
      .png()
      .toFile(file);

  beforeAll(async () => {
    cwd = mkdtempSync(join(tmpdir(), "pw-plates-"));
    pkg = join(cwd, "pkg");
    mkdirSync(join(pkg, "assets", "raw"), { recursive: true });
    await plate(join(pkg, "assets", "raw", "family-ai.png"), [232, 222, 202]);
    await plate(join(pkg, "assets", "raw", "genus-databases.png"), [232, 222, 202]);
    await plate(join(pkg, "assets", "raw", "genus-cloud-devops.png"), [64, 57, 43]);
    const approved = { style: "approved", speciesIdentity: "approved", composition: "approved" };
    const asset = (id: string, rank: string, ownerId: string, review: object) => ({
      id,
      rank,
      ownerId,
      subjects: ["Corvus corax"],
      outputPath: `assets/raw/${id}.png`,
      credit: "Pioneer Wiki · 先锋维基 (github.com/puresky271)",
      license: "CC BY 4.0",
      review,
    });
    writeFileSync(
      join(pkg, "asset-manifest.json"),
      JSON.stringify({
        assets: [
          asset("family-ai", "family", "ai", approved),
          asset("genus-databases", "genus", "databases", { ...approved, speciesIdentity: "pending" }),
          asset("genus-cloud-devops", "genus", "cloud-devops", approved),
          asset("genus-missing", "genus", "observability", approved),
        ],
      }),
    );
    writeFileSync(
      join(pkg, "taxonomy-map.json"),
      readFileSync(join(process.cwd(), "tests", "fixtures", "taxonomy-map.min.json"), "utf8"),
    );
    execFileSync(process.execPath, [join(process.cwd(), "tools", "prepare-catalogue-plates.mjs"), pkg], {
      cwd,
      stdio: "pipe",
    });
  });

  afterAll(() => rmSync(cwd, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));

  it("accessions only plates whose style, species and composition are all approved", () => {
    const plates = JSON.parse(readFileSync(join(cwd, "public", "catalogue", "plates.json"), "utf8"));
    expect(plates.map((p: { id: string }) => p.id)).toEqual(["family-ai"]);
    expect(plates[0]).toMatchObject({
      rank: "family",
      ownerId: "ai",
      src: "/catalogue/family-ai.webp",
      license: "CC BY 4.0",
      alt: { zh: expect.stringContaining("Corvidae"), en: expect.stringContaining("Corvidae") },
    });
    // Nothing about how the plate was made reaches the reader.
    expect(JSON.stringify(plates)).not.toMatch(/prompt|gpt|model/i);
  });

  it("refuses a plate whose edge is not bare paper, and prints the rest with transparent paper", async () => {
    const plates = JSON.parse(readFileSync(join(cwd, "public", "catalogue", "plates.json"), "utf8"));
    expect(plates.map((p: { id: string }) => p.id)).not.toContain("genus-cloud-devops");
    const { data, info } = await sharp(join(cwd, "public", "catalogue", "family-ai.webp"))
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    expect(data[3], "paper corner is transparent").toBeLessThan(16);
    const centre = ((info.height >> 1) * info.width + (info.width >> 1)) * 4;
    expect(data[centre + 3], "ink stays opaque").toBeGreaterThan(200);
  });
});
