"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { Lang, MemberProject, ProjectPreview } from "@/lib/model/types";
import type { GithubRepo } from "@/lib/members/github";
import { PROJECT_LIMITS, projectContent } from "@/lib/members/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ProjectImage } from "./ProjectImage";

type Props = {
  handle: string;
  projects: MemberProject[];
  onChange: Dispatch<SetStateAction<MemberProject[]>>;
  onBusyChange: (busy: boolean) => void;
  repositories: GithubRepo[];
  lang: Lang;
  disabled: boolean;
};

export function ProjectEditor({ handle, projects, onChange, onBusyChange, repositories, lang, disabled }: Props) {
  const zh = lang === "zh";
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; text: string; error: boolean } | null>(null);
  const locked = disabled || pending !== null;
  function patch(id: string, next: Partial<MemberProject>) {
    onChange((current) => current.map((project) => (project.id === id ? { ...project, ...next } : project)));
  }
  function add(url = "", title = "") {
    const project: MemberProject = { id: crypto.randomUUID(), url, title, description: "", tags: [], links: [] };
    onChange((current) => [...current, project]);
    if (url) void importPreview(project);
  }
  function move(id: string, step: number) {
    onChange((current) => {
      const next = [...current];
      const from = next.findIndex((project) => project.id === id);
      const to = from + step;
      if (from < 0 || to < 0 || to >= next.length) return current;
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }
  async function importPreview(project: MemberProject) {
    setPending(project.id);
    onBusyChange(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/members/${encodeURIComponent(handle)}/project-preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: project.url }),
      });
      if (!response.ok) throw new Error("preview");
      const preview = (await response.json()) as ProjectPreview;
      onChange((current) =>
        current.map((item) =>
          item.id === project.id && item.url === project.url ? { ...item, url: preview.url, preview } : item,
        ),
      );
      setFeedback({
        id: project.id,
        error: false,
        text: zh
          ? "预览已读取；你填写的内容保持不变。保存主页后公开。"
          : "Preview imported; your edits are preserved. Save your page to publish.",
      });
    } catch {
      setFeedback({
        id: project.id,
        error: true,
        text: zh
          ? "暂时无法读取预览。可手动填写名称、简介和图片后保存；已保存的预览仍会保留。"
          : "Preview unavailable. Add a title, description and image manually; any saved preview is kept.",
      });
    } finally {
      setPending(null);
      onBusyChange(false);
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-8">
      {repositories.length ? (
        <details className="text-small">
          <summary className="pw-link cursor-pointer" style={{ color: "var(--plate-ink)" }}>
            {zh ? "从我的 GitHub 工坊选入" : "Select from my GitHub workshop"}
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {repositories.map((repo) => (
              <li key={repo.url} className="flex min-w-0 items-center justify-between gap-3 border-b border-rule py-2">
                <span className="min-w-0">
                  <span className="block font-mono text-small break-all">{repo.name}</span>
                  <span className="line-clamp-2 block text-small text-ink-3">{repo.description}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    locked ||
                    projects.length >= PROJECT_LIMITS.projects ||
                    projects.some((project) => project.url.toLowerCase() === repo.url.toLowerCase())
                  }
                  onClick={() => add(repo.url)}
                >
                  {zh ? "选入" : "Select"}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {projects.map((project, index) => {
        const content = projectContent(project);
        const base = `project-${project.id}`;
        return (
          <FieldSet
            key={project.id}
            disabled={locked}
            data-editor-project={project.id}
            className="min-w-0 border-t border-rule pt-5"
          >
            <FieldLegend>
              {zh ? "作品" : "Work"} {index + 1}
              {content.title ? ` · ${content.title}` : ""}
            </FieldLegend>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || index === 0}
                onClick={() => move(project.id, -1)}
                aria-label={zh ? `上移作品 ${index + 1}` : `Move work ${index + 1} up`}
              >
                ↑ {zh ? "上移" : "Up"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || index === projects.length - 1}
                onClick={() => move(project.id, 1)}
                aria-label={zh ? `下移作品 ${index + 1}` : `Move work ${index + 1} down`}
              >
                ↓ {zh ? "下移" : "Down"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={locked}
                onClick={() => onChange((current) => current.filter((item) => item.id !== project.id))}
              >
                {zh ? "移除作品" : "Remove work"}
              </Button>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${base}-url`}>{zh ? "项目主地址" : "Project address"}</FieldLabel>
                <Input
                  id={`${base}-url`}
                  type="url"
                  maxLength={PROJECT_LIMITS.url}
                  value={project.url}
                  placeholder="https://…"
                  onChange={(event) => patch(project.id, { url: event.target.value, preview: undefined })}
                />
                <FieldDescription>
                  {zh
                    ? "GitHub 仓库或其他公开网站；导入后可修改展示内容。"
                    : "A GitHub repository or public website; imported content can be overridden."}
                </FieldDescription>
                <Button
                  type="button"
                  variant="outline"
                  disabled={locked || !project.url.trim()}
                  onClick={() => void importPreview(project)}
                  className="self-start"
                >
                  {pending === project.id
                    ? zh
                      ? "读取中…"
                      : "Reading…"
                    : zh
                      ? "读取／刷新预览"
                      : "Read / refresh preview"}
                </Button>
              </Field>
              {feedback?.id === project.id ? (
                <p role={feedback.error ? "alert" : "status"} className="text-small text-ink-2">
                  {feedback.text}
                </p>
              ) : null}
              <Field>
                <FieldLabel htmlFor={`${base}-title`}>{zh ? "项目名称" : "Project title"}</FieldLabel>
                <Input
                  id={`${base}-title`}
                  maxLength={PROJECT_LIMITS.title}
                  value={project.title}
                  placeholder={project.preview?.title || (zh ? "给这个项目起个名字" : "Name this project")}
                  onChange={(event) => patch(project.id, { title: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${base}-description`}>{zh ? "项目简介" : "Project description"}</FieldLabel>
                <Textarea
                  id={`${base}-description`}
                  rows={4}
                  maxLength={PROJECT_LIMITS.description}
                  value={project.description}
                  placeholder={
                    project.preview?.description ||
                    (zh
                      ? "它是什么？你做了什么？访客可以体验到什么？"
                      : "What is it, what did you make, and what can visitors try?")
                  }
                  onChange={(event) => patch(project.id, { description: event.target.value })}
                />
                <FieldDescription>
                  {zh
                    ? "名称和简介留空时使用网站预览；手动填写后始终优先展示。"
                    : "Empty title and description use the preview; your own text always takes priority."}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${base}-image`}>{zh ? "预览图片地址" : "Preview image address"}</FieldLabel>
                <Input
                  id={`${base}-image`}
                  type="url"
                  maxLength={PROJECT_LIMITS.url}
                  value={project.image ?? ""}
                  placeholder={project.preview?.image || "https://…"}
                  onChange={(event) => patch(project.id, { image: event.target.value || undefined })}
                />
                <FieldDescription>
                  {zh
                    ? "留空使用网站分享图。请使用允许展示的图片；访客从来源站点加载它。"
                    : "Leave empty to use the site's sharing image. Only use images you may display; visitors load them from the source."}
                </FieldDescription>
              </Field>
              {content.image ? (
                <div className="max-w-sm">
                  <ProjectImage src={content.image} title={content.title} domain={content.domain} />
                </div>
              ) : null}
              <Field>
                <FieldLabel htmlFor={`${base}-tags`}>{zh ? "技术／主题标签" : "Technology / topic tags"}</FieldLabel>
                <Input
                  id={`${base}-tags`}
                  value={project.tags.join(", ")}
                  placeholder="TypeScript, AI, Web"
                  onChange={(event) =>
                    patch(project.id, { tags: event.target.value.split(/[,，]/).map((tag) => tag.trimStart()) })
                  }
                />
                <FieldDescription>
                  {zh
                    ? "用逗号分隔，最多 8 个，每个 24 字。"
                    : "Separate with commas; up to 8 tags, 24 characters each."}
                </FieldDescription>
              </Field>
              {project.links.map((link, linkIndex) => (
                <FieldGroup key={linkIndex}>
                  <Field>
                    <FieldLabel htmlFor={`${base}-link-${linkIndex}-label`}>
                      {zh ? "入口名称" : "Link label"} {linkIndex + 1}
                    </FieldLabel>
                    <Input
                      id={`${base}-link-${linkIndex}-label`}
                      value={link.label}
                      maxLength={32}
                      placeholder={zh ? "在线体验 / 文档 / 源码" : "Live demo / Docs / Source"}
                      onChange={(event) =>
                        patch(project.id, {
                          links: project.links.map((item, at) =>
                            at === linkIndex ? { ...item, label: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${base}-link-${linkIndex}-url`}>
                      {zh ? "入口地址" : "Link address"} {linkIndex + 1}
                    </FieldLabel>
                    <Input
                      id={`${base}-link-${linkIndex}-url`}
                      type="url"
                      value={link.url}
                      maxLength={PROJECT_LIMITS.url}
                      placeholder="https://…"
                      onChange={(event) =>
                        patch(project.id, {
                          links: project.links.map((item, at) =>
                            at === linkIndex ? { ...item, url: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => patch(project.id, { links: project.links.filter((_, at) => at !== linkIndex) })}
                    className="self-start"
                  >
                    {zh ? "移除入口" : "Remove link"}
                  </Button>
                </FieldGroup>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || project.links.length >= PROJECT_LIMITS.links}
                onClick={() => patch(project.id, { links: [...project.links, { label: "", url: "" }] })}
                className="self-start"
              >
                + {zh ? "添加体验／文档等入口" : "Add a demo / docs link"}
              </Button>
            </FieldGroup>
          </FieldSet>
        );
      })}
      <Button
        type="button"
        variant="outline"
        disabled={locked || projects.length >= PROJECT_LIMITS.projects}
        onClick={() => add()}
        className="self-start"
      >
        + {zh ? "添加精选作品" : "Add selected work"} ({projects.length}/{PROJECT_LIMITS.projects})
      </Button>
      {!projects.length ? (
        <p className="text-small text-ink-3">
          {zh
            ? "选一件代表作，从一个网址开始。简介、预览和不同入口会一起出现在主页。"
            : "Start with one work and its address. Its story, preview and links will appear together on your page."}
        </p>
      ) : null}
    </div>
  );
}
