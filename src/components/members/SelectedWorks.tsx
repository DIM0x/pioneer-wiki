import type { Lang, MemberProject } from "@/lib/model/types";
import { projectContent } from "@/lib/members/projects";
import { formatDate } from "@/lib/format";
import { ProjectImage } from "./ProjectImage";

export function SelectedWorks({ projects, lang }: { projects: MemberProject[]; lang: Lang }) {
  const zh = lang === "zh";
  if (!projects.length) return null;
  return (
    <section aria-labelledby="selected-works" className="mt-(--space-section)">
      <header className="pw-ink-under mb-8 flex items-baseline justify-between gap-4 pb-3">
        <h2 id="selected-works" className="font-display text-h2">
          {zh ? "精选作品" : "Selected works"}
          <span className="ml-3 text-h4 text-ink-3">{zh ? "Selected works" : "精选作品"}</span>
        </h2>
        <span className="shrink-0 font-mono text-meta text-ink-3">{String(projects.length).padStart(2, "0")}</span>
      </header>
      <ol className="flex flex-col gap-10">
        {projects.map((project, index) => {
          const content = projectContent(project);
          const github = content.preview?.github;
          const links = [...project.links];
          if (
            github?.homepage &&
            github.homepage !== project.url &&
            !links.some((link) => link.url === github.homepage)
          ) {
            links.push({ label: zh ? "在线体验" : "Live demo", url: github.homepage });
          }
          return (
            <li
              key={project.id}
              data-project-id={project.id}
              className="border-b border-rule pb-10 last:pb-0 last:border-b-0"
            >
              <article className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-9">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={zh ? `访问 ${content.title}` : `Visit ${content.title}`}
                  className="group block self-start no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <ProjectImage src={content.image} title={content.title} domain={content.domain} />
                </a>
                <div className="flex min-w-0 flex-col items-start gap-4 md:py-1">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-meta text-ink-3">
                    <span style={{ color: "var(--plate-ink)" }}>No. {String(index + 1).padStart(2, "0")}</span>
                    <span className="break-all">{content.preview?.siteName || content.domain} ↗</span>
                  </p>
                  <h3 className="font-display text-h2 leading-tight break-words">
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="pw-link no-underline">
                      {content.title}
                    </a>
                  </h3>
                  {content.description ? (
                    <p className="whitespace-pre-line text-body leading-relaxed text-ink-2">{content.description}</p>
                  ) : null}
                  {project.tags.length ? (
                    <p className="font-mono text-meta text-ink-3">{project.tags.join(" · ")}</p>
                  ) : null}
                  {github ? (
                    <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-meta text-ink-3">
                      {github.language ? <span style={{ color: "var(--plate-ink)" }}>{github.language}</span> : null}
                      <span aria-label={zh ? `${github.stars} 颗星` : `${github.stars} stars`}>
                        ★ {github.stars.toLocaleString(lang)}
                      </span>
                      <span>
                        {zh ? "更新于" : "Updated"}{" "}
                        <time dateTime={github.updatedAt}>{formatDate(github.updatedAt, lang)}</time>
                      </span>
                      {github.archived ? <span>{zh ? "已归档" : "Archived"}</span> : null}
                    </p>
                  ) : null}
                  <nav
                    aria-label={zh ? `${content.title} 的入口` : `Explore ${content.title}`}
                    className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-2"
                  >
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pw-link text-small"
                      style={{ color: "var(--plate-ink)" }}
                    >
                      {github ? (zh ? "查看源码" : "View source") : zh ? "访问项目" : "Visit project"}{" "}
                      <span className="pw-nudge">↗</span>
                    </a>
                    {links.map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pw-link text-small text-ink-2"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </nav>
                  {content.preview ? (
                    <p className="font-mono text-[0.65rem] text-ink-3">
                      {zh ? "预览采集于" : "Preview captured"}{" "}
                      <time dateTime={content.preview.fetchedAt}>{formatDate(content.preview.fetchedAt, lang)}</time>
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
