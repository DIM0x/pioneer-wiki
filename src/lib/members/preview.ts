import "server-only";
import type { ProjectPreview } from "@/lib/model/types";
import { publicRepository } from "./github";
import { githubRepository } from "./projects";
import { readPublicHtml } from "./safe-fetch";
import { parseSharingInformation } from "./preview-parser";

export async function importProjectPreview(url: string): Promise<ProjectPreview> {
  if (githubRepository(url)) {
    const repository = await publicRepository(url);
    if (!repository) throw new Error("The public repository could not be read");
    return repository;
  }
  const page = await readPublicHtml(url);
  return parseSharingInformation(page.html, page.url, url);
}
