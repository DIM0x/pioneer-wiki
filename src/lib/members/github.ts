import "server-only";
import type { ProjectPreview } from "@/lib/model/types";
import { githubRepository, PROJECT_LIMITS } from "./projects";

export interface GithubRepo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

/** A specifically selected repository may be a fork, archived, or outside the member's own account. */
export async function publicRepository(url: string): Promise<ProjectPreview | null> {
  const repository = githubRepository(url);
  if (!repository) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "pioneer-wiki" },
      redirect: "error",
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      !data ||
      data.private !== false ||
      typeof data.name !== "string" ||
      typeof data.full_name !== "string" ||
      data.full_name.toLowerCase() !== repository.toLowerCase() ||
      typeof data.pushed_at !== "string"
    )
      return null;
    let homepage: string | undefined;
    try {
      if (data.homepage) {
        const parsed = new URL(data.homepage);
        if (["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password)
          homepage = parsed.href;
      }
    } catch {
      /* Optional. */
    }
    return {
      url,
      title: data.name.slice(0, PROJECT_LIMITS.title),
      description: typeof data.description === "string" ? data.description.slice(0, PROJECT_LIMITS.description) : "",
      siteName: "GitHub",
      image: `https://opengraph.githubassets.com/1/${repository}`,
      fetchedAt: new Date().toISOString(),
      github: {
        fullName: data.full_name,
        language: typeof data.language === "string" ? data.language.slice(0, 40) : null,
        stars: Number.isSafeInteger(data.stargazers_count) && data.stargazers_count >= 0 ? data.stargazers_count : 0,
        forks: Number.isSafeInteger(data.forks_count) && data.forks_count >= 0 ? data.forks_count : 0,
        updatedAt: data.pushed_at,
        archived: data.archived === true,
        homepage,
      },
    };
  } catch {
    return null;
  }
}

/**
 * A member's public GitHub repositories, most recently pushed first (forks
 * left out). Fetched from the public REST API and cached for an hour; any
 * failure (offline, rate limit, unknown login) yields an empty list, so the
 * page never breaks on GitHub's account.
 */
export async function publicRepos(login: string, limit = 6): Promise<GithubRepo[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=pushed&per_page=30`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "pioneer-wiki" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const list = (await res.json()) as Array<{
      name: string;
      html_url: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      pushed_at: string;
      fork: boolean;
      archived: boolean;
    }>;
    return list
      .filter((r) => !r.fork)
      .slice(0, limit)
      .map((r) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.pushed_at,
      }));
  } catch {
    return [];
  }
}
