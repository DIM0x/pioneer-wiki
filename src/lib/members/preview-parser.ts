import { parse, type DefaultTreeAdapterTypes } from "parse5";
import type { ProjectPreview } from "@/lib/model/types";
import { PROJECT_LIMITS } from "./projects";

function normalize(value: string, limit: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

/** HTML is parsed as data only; entities and attribute ordering are handled by the parser. */
export function parseSharingInformation(html: string, pageUrl: string, sourceUrl = pageUrl): ProjectPreview {
  const metadata = new Map<string, string>();
  let title = "";
  function visit(node: DefaultTreeAdapterTypes.Node) {
    if ("tagName" in node && node.tagName === "meta") {
      const attrs = new Map(node.attrs.map((attr) => [attr.name, attr.value]));
      const key = (attrs.get("property") || attrs.get("name") || "").toLowerCase();
      const content = attrs.get("content");
      if (content && !metadata.has(key)) metadata.set(key, content);
    }
    if ("tagName" in node && node.tagName === "title") {
      title = node.childNodes.flatMap((child) => ("value" in child ? [child.value] : [])).join("");
    }
    if ("childNodes" in node) node.childNodes.forEach(visit);
  }
  visit(parse(html));
  const rawImage = metadata.get("og:image:secure_url") || metadata.get("og:image") || metadata.get("twitter:image");
  let image: string | undefined;
  if (rawImage) {
    try {
      const url = new URL(rawImage, pageUrl);
      if (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.href.length <= PROJECT_LIMITS.url
      )
        image = url.href;
    } catch {
      /* A malformed image never prevents importing text. */
    }
  }
  return {
    url: sourceUrl,
    title: normalize(
      metadata.get("og:title") || metadata.get("twitter:title") || title || new URL(pageUrl).hostname,
      PROJECT_LIMITS.title,
    ),
    description: normalize(
      metadata.get("og:description") || metadata.get("twitter:description") || metadata.get("description") || "",
      PROJECT_LIMITS.description,
    ),
    siteName: normalize(metadata.get("og:site_name") || new URL(pageUrl).hostname, 100),
    image,
    fetchedAt: new Date().toISOString(),
  };
}
