import type { MemberProject } from "@/lib/model/types";

export const PROJECT_LIMITS = { projects: 8, title: 100, description: 800, tags: 8, tag: 24, links: 4, url: 2048 };

export function githubRepository(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password || url.port)
      return null;
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length !== 2 || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(parts[0]) || !/^[\w.-]{1,100}$/.test(parts[1]))
      return null;
    return `${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

export function projectContent(project: MemberProject) {
  let domain = "";
  try {
    domain = new URL(project.url).hostname.replace(/^www\./, "");
  } catch {
    /* An unfinished editor draft. */
  }
  const preview = project.preview?.url === project.url ? project.preview : undefined;
  return {
    title: project.title.trim() || preview?.title || domain,
    description: project.description.trim() || preview?.description || "",
    image: project.image || preview?.image,
    domain,
    preview,
  };
}
