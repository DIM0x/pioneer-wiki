> **🌐 语言 / Language**: [中文](#贡献指南) | [English](#contributing-to-pioneer-wiki)

---

# 贡献指南

感谢你为 Pioneer Wiki 做贡献！这是一个公开仓库，欢迎 Bug 修复、文档改进、测试、翻译和经过讨论的功能改动。

## 贡献路径

- 组织成员可以在仓库中直接创建主题分支；外部贡献者请先 Fork 仓库。
- 所有改动都必须通过 Pull Request 合并到 `main`，不要直接推送 `main`。
- 小修复、文档和测试可以直接提交 PR。
- 较大功能、数据模型调整或 Supabase 变更，请先创建 Issue 说明问题和方案，再开始实现。
- 仓库提供结构化的 [Bug 报告](.github/ISSUE_TEMPLATE/01-bug-report.yml) 和 [工程任务](.github/ISSUE_TEMPLATE/02-engineering-task.yml) 模板。

## AI 辅助贡献政策

欢迎使用 AI 工具，但提交者必须对最终 PR 负责：

- 你需要理解改动的目标、范围、行为变化和验证结果。
- AI 生成的代码必须经过人工检查，不要直接提交未经验证的复制内容。
- 保持 PR 聚焦，避免把无关重构、格式化或生成文件混在一起。
- 行为变化需要测试，UI 或交互变化必须提供截图或录屏。
- 如果某项自动化检查不适用，请在 PR 中说明原因和人工验证方式。

## 快速开始

### 前置要求

- Node.js 22.x（CI 使用的版本）
- npm
- 需要验证 UI 时使用可运行本项目的现代浏览器

### 本地运行

```bash
git clone https://github.com/NEUP-Net-Depart/pioneer-wiki.git
cd pioneer-wiki
npm ci
npm run dev
```

默认使用内存 Mock 数据，不需要 Supabase 密钥。需要强制使用本地模拟账户时设置 `PIONEER_DATA_SOURCE=mock`。使用真实 Supabase 时，请参考 `.env.example`，并绝不要提交 `SUPABASE_SERVICE_ROLE_KEY` 或其他密钥。

## 开始修改

从最新的 `main` 创建主题分支：

```bash
git switch main
git pull --ff-only
git switch -c fix/short-description
# 或 feature/short-description、docs/short-description、test/short-description
```

提交信息使用简短的 Conventional Commits 风格，例如：

```text
fix: prevent duplicate revision titles
feat: add member profile editing
docs: explain local mock data
test: cover auth validation edge case
```

遵循现有 TypeScript 和 React 风格：两空格缩进、双引号、分号；组件和组件文件使用 PascalCase，函数和变量使用 camelCase，URL 段和静态资源使用 kebab-case。优先使用 `@/*` 导入别名，并将共享逻辑放在 `src/lib` 或 `src/components`。

## 验证改动

根据改动范围运行适用检查。代码 PR 在提交前至少运行：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest 测试位于 `tests/auth`、`tests/services` 和 `tests/frontend`，文件使用 `*.test.ts` 命名。服务、认证、解析器或双语内容发生行为变化时，请添加回归测试。UI 变化还应运行 `npm run dev`，在受影响页面完成真实流程，并在 PR 中附截图或录屏。

## 提交 Pull Request

PR 描述请包含：

1. 问题背景、解决方案和用户影响。
2. 关联 Issue，例如 `Closes #123`；较大功能应先有讨论记录。
3. 执行过的验证命令及结果。
4. UI 或行为变化的截图、录屏或前后对比。
5. Supabase migration、环境变量、媒体资源或许可证方面的额外步骤。

维护者会根据 CI、测试、范围聚焦程度、兼容性和可回滚性进行评审。CI 失败时，请在更新 PR 前说明失败原因或修复方式。

## 资源与许可证

代码和文档采用 Apache License 2.0，详见 [LICENSE](LICENSE)。`public/` 下现有 AI 生成插图按 CC BY 4.0 发布，详见 [LICENSE-ILLUSTRATIONS.md](LICENSE-ILLUSTRATIONS.md)。新增图片、字体或其他资源必须确认兼容许可，并在需要时保留作者、来源和署名信息。不要提交 API 密钥、账号信息或未脱敏的诊断日志。

---

# Contributing to Pioneer Wiki

Thank you for contributing to Pioneer Wiki. This public repository welcomes bug fixes, documentation, tests, translations, and feature work that has been discussed when the scope is substantial.

## Contribution Path

- Organization members may create topic branches in the repository; outside contributors should start from a fork.
- Every change must reach `main` through a pull request. Do not push directly to `main`.
- Small fixes, documentation, and tests may go straight to a pull request.
- Discuss larger features, data-model changes, and Supabase changes in an Issue before implementation.
- Use the structured [Bug Report](.github/ISSUE_TEMPLATE/01-bug-report.yml) and [Engineering Task](.github/ISSUE_TEMPLATE/02-engineering-task.yml) forms.

## AI-Assisted Contributions

AI tools are welcome, but the contributor owns the final pull request. Understand its goal, scope, behavior changes, and verification results; review generated code manually; keep the change focused; and add regression tests for behavior changes. UI or interaction changes must include screenshots or a recording. When automation is not applicable, explain the reason and the manual verification performed.

## Getting Started

Use Node.js 22.x and npm:

```bash
git clone https://github.com/NEUP-Net-Depart/pioneer-wiki.git
cd pioneer-wiki
npm ci
npm run dev
```

The default backend uses in-memory mock data. Set `PIONEER_DATA_SOURCE=mock` to force the local simulated account. For Supabase development, follow `.env.example`; never commit `SUPABASE_SERVICE_ROLE_KEY` or any other secret.

Create a focused branch from `main`, for example `fix/short-description`, `feature/short-description`, `docs/short-description`, or `test/short-description`. Use short Conventional Commits such as `fix: ...`, `feat: ...`, `docs: ...`, and `test: ...`.

## Verification

Before submitting a code PR, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests live under `tests/auth`, `tests/services`, and `tests/frontend` and use the `*.test.ts` naming pattern. Add regression coverage for service, auth, parser, or bilingual-content behavior. For UI changes, run the affected flow locally and include visual evidence in the PR.

## Pull Requests

Explain the problem, solution, user impact, linked Issue, validation commands, and any screenshots or recordings. Call out Supabase migrations, environment variables, media assets, and licensing steps. Keep each PR focused and respond to CI failures with either a fix or a clear explanation.

## Assets and License

Code and documentation are licensed under Apache License 2.0. Existing AI-generated illustrations under `public/` are CC BY 4.0; see [LICENSE-ILLUSTRATIONS.md](LICENSE-ILLUSTRATIONS.md). New images, fonts, and other assets must have compatible licenses and retain required attribution. Never commit secrets, account data, or unsanitized diagnostics.
