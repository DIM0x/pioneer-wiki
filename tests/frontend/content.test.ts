import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { dictionaries } from "@/lib/i18n/dictionary";
import { extractToc } from "@/lib/markdown/toc";
import { splitHeading } from "@/lib/markdown/bilingual";
import { catalogueNumber, toRoman } from "@/lib/roman";
import { Markdown } from "@/components/markdown/Markdown";

describe("i18n dictionary", () => {
  it("has the same keys in both languages, none empty", () => {
    const zh = Object.keys(dictionaries.zh).sort();
    const en = Object.keys(dictionaries.en).sort();
    expect(en).toEqual(zh);
    for (const lang of ["zh", "en"] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) expect(value, `${lang}:${key}`).not.toBe("");
    }
  });
});

describe("roman numerals", () => {
  it("formats plate and phylum numbers", () => {
    expect([1, 4, 9, 10, 14, 16, 2026].map(toRoman)).toEqual(["I", "IV", "IX", "X", "XIV", "XVI", "MMXXVI"]);
    expect(catalogueNumber("PW-0016")).toBe(16);
  });
});

describe("bilingual markdown", () => {
  const body = [
    ":::zh",
    "中文段落。",
    ":::",
    "",
    ":::en",
    "An English paragraph.",
    ":::",
    "",
    "## 推、拉与推拉 | Push, pull and push–pull",
    "",
    "### Plain heading",
    "",
    "```go",
    "func f() {}",
    "```",
  ].join("\n");

  it("splits 中文 | English headings", () => {
    expect(splitHeading("模型 | The model")).toEqual({ zh: "模型", en: "The model", text: "模型 | The model" });
    expect(splitHeading("Plain")).toEqual({ text: "Plain" });
  });

  it("gives the table of contents the same ids the renderer puts on headings", () => {
    const toc = extractToc(body);
    const html = renderToStaticMarkup(Markdown({ lang: "zh", children: body }));
    expect(toc.map((t) => t.id)).toEqual(["push-pull-and-pushpull", "plain-heading"]);
    for (const item of toc) expect(html).toContain(`id="${item.id}"`);
  });

  it("pairs adjacent zh/en blocks and labels code with its language", () => {
    const html = renderToStaticMarkup(Markdown({ lang: "en", children: body }));
    expect(html).toContain('class="pw-bi-pair"');
    expect(html).toMatch(/data-lang="zh"[^>]*>|lang="zh-CN"/);
    expect(html).toContain('data-lang="go"');
    expect(html).toMatch(/Go<span class="pw-code-count">1 line<\/span>/);
    // Line numbers live in their own aria-hidden gutter, never inside the code that gets copied.
    expect(html).toMatch(/<pre aria-hidden="true" class="pw-code-gutter">1<\/pre>/);
  });

  it("normalises CRLF so code and line counts carry no \\r", () => {
    const html = renderToStaticMarkup(Markdown({ lang: "zh", children: "```py\r\na = 1\r\nb = 2\r\n```\r\n" }));
    expect(html).not.toContain("\r");
    expect(html).toMatch(/<span class="pw-code-count">2 行<\/span>/);
  });
});
