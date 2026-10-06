import type { MemberProject, ProjectPreview } from "@/lib/model/types";
import { ServiceError } from "@/lib/services/contracts";
import { githubRepository, PROJECT_LIMITS } from "./projects";

function invalid(message: string): never {
  throw new ServiceError("invalid", message);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("Invalid project");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim()))
    invalid("Invalid project text");
  return value.trim();
}
export function projectUrl(value: unknown): string {
  const input = text(value, PROJECT_LIMITS.url, true);
  try {
    const url = new URL(input);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname)
      invalid("Use a public http(s) address");
    return url.href;
  } catch {
    invalid("Use a public http(s) address");
  }
}
function optionalUrl(value: unknown): string | undefined {
  return value ? projectUrl(value) : undefined;
}
function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) invalid("Invalid repository count");
  return value;
}
function date(value: unknown): string {
  const result = text(value, 40, true);
  if (!Number.isFinite(Date.parse(result))) invalid("Invalid preview date");
  return result;
}
function previewOf(value: unknown, url: string): ProjectPreview | undefined {
  if (value === undefined || value === null) return undefined;
  const input = record(value);
  const source = projectUrl(input.url);
  if (source !== url) return undefined;
  const preview: ProjectPreview = {
    url: source,
    title: text(input.title, PROJECT_LIMITS.title),
    description: text(input.description, PROJECT_LIMITS.description),
    image: optionalUrl(input.image),
    siteName: text(input.siteName, 100),
    fetchedAt: date(input.fetchedAt),
  };
  if (input.github) {
    const github = record(input.github);
    const fullName = text(github.fullName, 140, true);
    if (githubRepository(url)?.toLowerCase() !== fullName.toLowerCase() || typeof github.archived !== "boolean")
      invalid("Invalid repository preview");
    preview.github = {
      fullName,
      language: github.language === null ? null : text(github.language, 40),
      stars: count(github.stars),
      forks: count(github.forks),
      updatedAt: date(github.updatedAt),
      archived: github.archived,
      homepage: optionalUrl(github.homepage),
    };
  }
  return preview;
}

/** Shared by both stores: normalize unknown HTTP input, keep order, and drop extra fields. */
export function validateProjects(value: unknown): MemberProject[] {
  if (!Array.isArray(value) || value.length > PROJECT_LIMITS.projects)
    invalid(`At most ${PROJECT_LIMITS.projects} selected works`);
  const ids = new Set<string>();
  return value.map((raw) => {
    const input = record(raw);
    const id = text(input.id, 64, true);
    if (!/^[\w-]+$/.test(id) || ids.has(id)) invalid("Project IDs must be unique");
    ids.add(id);
    const url = projectUrl(input.url);
    if (
      !Array.isArray(input.tags) ||
      input.tags.length > PROJECT_LIMITS.tags ||
      !Array.isArray(input.links) ||
      input.links.length > PROJECT_LIMITS.links
    )
      invalid("Too many project tags or links");
    const project: MemberProject = {
      id,
      url,
      title: text(input.title, PROJECT_LIMITS.title),
      description: text(input.description, PROJECT_LIMITS.description),
      image: optionalUrl(input.image),
      tags: [...new Set(input.tags.map((tag) => text(tag, PROJECT_LIMITS.tag, true)))],
      links: input.links.map((rawLink) => {
        const link = record(rawLink);
        return { label: text(link.label, 32, true), url: projectUrl(link.url) };
      }),
      preview: previewOf(input.preview, url),
    };
    if (!project.title && !project.preview?.title) invalid("Give the project a title or import a preview");
    return project;
  });
}

/** Older or malformed stored records must not emit unchecked external links. */
export function readProjects(value: unknown): MemberProject[] {
  try {
    return validateProjects(value ?? []);
  } catch {
    return [];
  }
}
