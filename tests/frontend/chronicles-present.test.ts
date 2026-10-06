import { describe, expect, it } from "vitest";
import type { ChronicleResource } from "@/lib/model/types";
import { addressOf, dayOf, openableUrl, registerNumber, tallyText } from "@/lib/chronicles/present";

const resource = (kind: ChronicleResource["kind"]): ChronicleResource => ({
  kind,
  label: { zh: "资料", en: "Material" },
  url: "https://example.org/x",
});

describe("how a chronicle's facts are printed", () => {
  it("opens only absolute http(s) addresses", () => {
    expect(openableUrl("https://example.org/recordings/2026-09-07")).toBe("https://example.org/recordings/2026-09-07");
    expect(openableUrl("  http://example.org  ")).toBe("http://example.org/");
    for (const bad of [
      "",
      undefined,
      "javascript:alert(1)",
      "data:text/html,x",
      "/chronicles",
      "example.org/x",
      "ftp://x",
    ])
      expect(openableUrl(bad), String(bad)).toBeNull();
  });

  it("prints the day from the date itself, whatever the time zone", () => {
    expect(dayOf("2026-10-05", "zh")).toBe("10月5日");
    expect(dayOf("2026-10-05", "en")).toBe("5 Oct");
    expect(dayOf("2026-01-01", "en")).toBe("1 Jan");
    expect(registerNumber(8)).toBe("No. 008");
  });

  it("counts materials by kind, in vocabulary order, and names a link a link rather than a download", () => {
    const resources = [resource("link"), resource("video"), resource("document"), resource("video")];
    expect(tallyText(resources, "zh")).toBe("录像 2 · 文件 1 · 链接 1");
    expect(tallyText(resources, "en")).toBe("Recording 2 · Document 1 · Link 1");
    expect(tallyText([], "en")).toBe("");
  });

  it("shows where a long link goes without its scheme", () => {
    expect(addressOf("https://example.org/chronicles/2026-06-01-founding/")).toBe(
      "example.org/chronicles/2026-06-01-founding",
    );
  });
});
