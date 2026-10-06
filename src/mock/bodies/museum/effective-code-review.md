:::zh
**有效代码评审：证据与可执行反馈**是对代码变更进行协作检查，以发现缺陷、评估设计并促进代码库可维护性的过程。策展对应物为 *Pelvicachromis pulcher*，仅指分类目录关联，不以慈鲷行为类比软件团队。

## 定义与边界 | Definition and boundaries

代码评审不是作者为自己的实现寻找赞同，也不是由一位审阅者替代自动测试、产品验收或安全审计。评审者阅读变更及足够上下文，判断它是否满足用户目标、融入现有系统、保持复杂度可理解，并在需要时提出可复现的风险。Google 的工程实践指南把整体设计、功能、复杂度、测试、命名、文档与代码健康列为重要检查面；其中尤其强调审阅范围应覆盖被分配的人工编写代码，并在不具备专门能力时安排合适的审阅者。[C1]

Google 的评审标准把持续改善代码库健康作为核心目的，并建议当变更整体上明确改善可维护性时，即使还有非关键润色，也不应为了追求完美而无限期阻塞。[C2] 这是一套组织内工程实践，而非适用于所有团队的实验证明；代码风险、团队责任和交付约束仍需结合本地情境判断，评审也不应扩张成无边界的设计辩论。

## 工作机制 | How it works

作者应提交聚焦变更，说明要解决的问题、关键决策、风险、验证结果和需要重点看的部分。小而连贯的差异更容易形成有效审阅；必要时先单独提交纯格式化或机械改动。评审者先理解变更动机和周围调用，再依次检查行为、边界条件、并发、错误处理、权限、数据迁移与复杂度。评论引用具体代码或运行证据，说明风险及其用户影响，给出可执行修改或问题，而非只说“这里不对”。

问题严重度应与后果匹配：阻断数据泄露、错误结果或部署故障的评论要清晰区分于命名偏好和可选重构。若建议仅是风格偏好，不应伪装成必须修改的正确性问题。评审者确认测试是否覆盖需求和边界，但测试也需要判断是否真的会在缺陷存在时失败。若变更涉及用户界面、并发或无法仅从代码判断的行为，可请求演示或额外验证。作者应逐项回应评论，记录接受、调整或不同意的理由，并确保解决方案覆盖原始风险。

## 一个例子 | A worked example

一个请求把单租户导出改为支持租户筛选。评审者先看 API 契约、调用方和权限检查，再追踪过滤条件是否应用到列表、分页和后台任务。若筛选只在客户端执行，跨租户数据仍可能经直接请求导出。高优先级评论应指出可复现请求和潜在数据暴露；建议增加服务端授权测试，覆盖同租户、异租户和无权用户。另一个评论可能指出变量名不清晰；它可作为低优先级维护建议，不应与泄露风险并列阻塞。发布说明和文档若改变用户操作，也应一并更新。

## 局限与误解 | Limits and misconceptions

评审是有限时间下的人工检查，无法证明程序没有缺陷。疲劳、陌生模块、过大差异和缓慢响应会降低注意质量。把每条偏好都设为阻断条件，容易让评审成为风格审判并拖延交付；只快速点“批准”又会制造虚假的安全感。评审者可能缺少领域知识，应明确求助而非猜测。审阅者数量增加也不保证独立检查；团队应管理负荷、优先级和响应时限，并用自动化覆盖可重复检查。

## 相关标本 | Related specimens

参见[协作中的分工、共享与责任](/entries/collaborative-work)明确评审责任，[测试与调试](/entries/testing-debugging)建立行为证据，并用[技术文档](/entries/technical-documentation)同步用户可见变化。Google 的“评审检查项”与“评审标准”两份工程指南分别说明检查范围和取舍原则；它们是实践建议，应结合本团队的风险、代码库健康和交付节奏评估 [S1, S2]。
:::

:::en
**Effective Code Review: Evidence and Actionable Feedback** is a collaborative examination of a code change to find defects, assess design, and maintain the health of a codebase. Its editorial taxonomic counterpart is *Pelvicachromis pulcher*, a catalogue relationship only; cichlid behaviour is not used as an analogy for software teams.

## 定义与边界 | Definition and boundaries

Code review is not an author seeking approval for an implementation, nor does one reviewer replace automated tests, product acceptance, or a security audit. A reviewer reads a change with enough context to judge whether it serves the user, fits the surrounding system, remains understandable, and introduces a reproducible risk. Google's engineering practices guide names overall design, functionality, complexity, tests, naming, documentation, and code health as important review concerns. It also says reviewers should understand the assigned human-written code and involve a qualified reviewer when specialized expertise is needed [C1].

Google's review standard identifies improving the overall health of a codebase as the primary purpose and recommends approving a change that clearly improves maintainability even if non-critical polish remains [C2]. This is an organizational engineering practice, not experimental proof for every team. Reviewers still need to judge risk, team responsibility, and delivery constraints in context, and review should not turn into an unbounded design debate detached from the submitted change.

## 工作机制 | How it works

The author should submit a focused change and explain the problem, key decisions, risks, validation performed, and parts that need careful attention. A small, coherent diff is easier to inspect; when needed, formatting-only or mechanical changes can be separated. The reviewer first understands the motivation and surrounding callers, then checks behavior, edge cases, concurrency, error handling, permissions, migrations, and complexity. A useful comment points to concrete code or evidence, explains the risk and its user impact, and gives an actionable change or question rather than simply saying “this is wrong.”

Match the priority of a comment to the consequence. A concern about data exposure, incorrect results, or deployment failure should be clearly distinguished from a naming preference or optional refactor. A style preference should not be presented as a correctness requirement. The reviewer should ask whether tests cover the requirement and relevant boundaries, while also checking that a test would fail if the behavior were broken. For a user-interface change, concurrency behavior, or an effect that cannot be inferred from code alone, request a demonstration or further validation. The author should respond to each comment, record why a suggestion was accepted or adjusted, and ensure the resolution addresses the original risk.

## 一个例子 | A worked example

A change adds tenant filtering to an export endpoint. The reviewer checks the API contract, callers, and authorization rule, then traces whether the filter applies to the collection, pagination, and background job. If filtering happens only in the client, a direct request may still export another tenant's data. A high-priority comment should describe a reproducible request and the possible exposure, then request a server-side authorization test covering same-tenant, cross-tenant, and unauthorized users. A separate comment about an unclear variable name may be a low-priority maintenance suggestion; it should not block the change on the same grounds as a data leak. Release notes and documentation should also change if the user-visible workflow changes.

## 局限与误解 | Limits and misconceptions

Review is a manual check under limited time and cannot prove that software has no defects. Fatigue, unfamiliar modules, oversized diffs, and slow responses can reduce attention. Making every preference a blocking condition turns review into a style trial and delays delivery; clicking “approve” quickly creates false confidence. Reviewers may lack domain expertise and should ask for help instead of guessing. More reviewers do not guarantee independent inspection. Teams need to manage workload, priorities, and response times, while automation handles repeatable checks.

## 相关标本 | Related specimens

See [Collaborative Work](/entries/collaborative-work) for review responsibilities, [Testing and Debugging](/entries/testing-debugging) for behavioral evidence, and [Technical Documentation](/entries/technical-documentation) for updating user-facing changes. Google's “What to look for” and “Standard of Code Review” guides cover review scope and trade-offs. They are practice recommendations that should be evaluated against a team's risks, code health, and delivery pace [S1, S2].
:::
