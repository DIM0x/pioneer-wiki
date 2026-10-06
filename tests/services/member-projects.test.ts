import { describe, expect, it, vi } from "vitest";
import type { MemberProject } from "@/lib/model/types";
import { createMockServices } from "@/lib/services/mock";
import { validateProjects } from "@/lib/members/project-validation";
import { githubRepository, projectContent } from "@/lib/members/projects";
import { parseSharingInformation } from "@/lib/members/preview-parser";

vi.mock("server-only", () => ({}));
import { isPublicAddress, publicTarget } from "@/lib/members/safe-fetch";

const work = (id = "first"): MemberProject => ({
  id,
  url: "https://example.org/work",
  title: "My work",
  description: "A useful project",
  tags: ["TypeScript"],
  links: [{ label: "Docs", url: "https://example.org/docs" }],
});

describe("selected member works", () => {
  it("saves, reorders and clears works without changing existing links or GitHub settings", async () => {
    const { community } = createMockServices();
    const before = await community.getMember("qingkong");
    const next = await community.updateMember("qingkong", { projects: [work("second"), work("first")] });
    expect(next?.projects?.map((project) => project.id)).toEqual(["second", "first"]);
    expect(next?.links).toEqual(before?.links);
    expect(next?.github).toEqual(before?.github);
    expect((await community.getMember("qingkong"))?.projects).toEqual(next?.projects);
    await community.updateMember("qingkong", { bio: before!.bio });
    expect((await community.getMember("qingkong"))?.projects).toHaveLength(2);
    expect((await community.updateMember("qingkong", { projects: [] }))?.projects).toEqual([]);
  });

  it("rejects unsafe or malformed values and leaves the saved portfolio untouched", async () => {
    const { community } = createMockServices();
    await community.updateMember("qingkong", { projects: [work()] });
    const invalid = [
      [work(), work()],
      Array.from({ length: 9 }, (_, index) => work(String(index))),
      [{ ...work(), url: "javascript:alert(1)" }],
      [{ ...work(), image: "data:image/svg+xml,evil" }],
      [{ ...work(), url: "https://secret@example.org/" }],
      [{ ...work(), links: [{ label: "bad", url: "file:///etc/passwd" }] }],
      [{ ...work(), tags: ["x".repeat(25)] }],
      [{ ...work(), title: "", preview: undefined }],
      [null],
    ];
    for (const projects of invalid) {
      await expect(community.updateMember("qingkong", { projects: projects as MemberProject[] })).rejects.toMatchObject(
        { code: "invalid" },
      );
      expect((await community.getMember("qingkong"))?.projects).toEqual([work()]);
    }
  });

  it("uses imported content only for empty fields and invalidates previews belonging to an old address", () => {
    const preview = parseSharingInformation(
      '<title>Imported</title><meta name="description" content="Imported story">',
      work().url,
    );
    const imported = { ...work(), title: "", description: "", preview };
    expect(validateProjects([imported])[0].preview?.title).toBe("Imported");
    expect(projectContent(imported).title).toBe("Imported");
    expect(projectContent({ ...imported, title: "My own title" }).title).toBe("My own title");
    expect(projectContent({ ...imported, description: "My own story" }).description).toBe("My own story");
    expect(
      validateProjects([{ ...work(), preview: { ...preview, url: "https://old.example.org/" } }])[0].preview,
    ).toBeUndefined();
    expect(() =>
      validateProjects([{ ...imported, preview: { ...preview, url: "https://old.example.org/" } }]),
    ).toThrow();
  });

  it("recognizes repository roots, including external owners, while rejecting lookalikes and subpages", () => {
    expect(githubRepository("https://github.com/openai/example.git")).toBe("openai/example");
    expect(githubRepository("https://github.com/other-owner/a.repo/")).toBe("other-owner/a.repo");
    for (const url of [
      "https://github.com.evil.org/a/b",
      "https://github.com/a",
      "https://github.com/a/b/issues",
      "http://github.com/a/b",
      "https://user@github.com/a/b",
    ])
      expect(githubRepository(url)).toBeNull();
  });
});

describe("sharing information", () => {
  it("reads reordered, quoted attributes and HTML entities without executing page content", () => {
    const html = `<script>throw new Error('never execute')</script><title>Fallback</title>
      <meta content='A &amp; B' property='og:title'>
      <meta name=description content='ordinary'>
      <meta property=og:description content='A &quot;real&quot; project'>
      <meta content='/preview.png' property='og:image'>
      <meta property='og:site_name' content='Workshop'>`;
    const preview = parseSharingInformation(html, "https://example.org/final", "https://example.org/original");
    expect(preview).toMatchObject({
      url: "https://example.org/original",
      title: "A & B",
      description: 'A "real" project',
      image: "https://example.org/preview.png",
      siteName: "Workshop",
    });
  });

  it("falls back to Twitter, page title and description, rejecting non-http images", () => {
    expect(
      parseSharingInformation(
        '<meta name="twitter:title" content="Twitter"><meta name="twitter:image" content="javascript:evil">',
        "https://example.org",
      ),
    ).toMatchObject({ title: "Twitter", image: undefined });
    expect(
      parseSharingInformation(
        '<title>Page</title><meta name="description" content="Page story">',
        "https://example.org",
      ),
    ).toMatchObject({ title: "Page", description: "Page story" });
    expect(parseSharingInformation("", "https://example.org").title).toBe("example.org");
  });
});

describe("public website boundaries", () => {
  it("rejects internal, mapped, metadata, reserved and unusual-port destinations", () => {
    for (const address of [
      "127.0.0.1",
      "10.0.0.1",
      "169.254.169.254",
      "192.168.1.1",
      "172.16.0.1",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "192.0.2.1",
      "::1",
      "::",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "2001:db8::1",
    ])
      expect(isPublicAddress(address), address).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
    for (const url of [
      "http://localhost/",
      "http://x.local/",
      "http://2130706433/",
      "http://0x7f000001/",
      "http://[::ffff:127.0.0.1]/",
      "http://example.org:8080/",
      "https://user:pass@example.org/",
      "file:///secret",
    ])
      expect(() => publicTarget(url), url).toThrow();
  });
});
