:::zh
**AI 辅助开发**是开发者把需求解释、方案比较、代码编写、重构或测试等有限任务交给 AI 工具协作完成，同时保留需求定义、结果核验和最终决策的工作方式。有效工作流的单位不是“生成了多少代码”，而是一个可检查的变更及其证据。本文的博物学对应物是 **Cyanocitta cristata**（蓝松鸦），仅为策展配对。

## 定义与边界 | Definition and boundaries

开发者负责确定问题、约束、验收标准及风险；AI 工具根据获得的上下文生成解释、建议或补丁。上下文可以包括相关源文件、错误信息、接口约定和测试，而不是整个仓库或未授权的机密。模型可能只建议一段文本，也可能通过编辑器或 Agent 调用读取、修改文件和运行命令。工具权限决定它能做什么，不代表输出天然正确。真实仓库问题也是可评测任务：[SWE-bench](https://arxiv.org/abs/2310.06770)以 GitHub issue、代码库和修复提交评估模型能否完成软件工程工作。GitHub 的 [Copilot 代码补全负责任使用指南](https://docs.github.com/en/copilot/responsible-use-of-github-copilot-features/responsible-use-of-github-copilot-code-completion)提醒使用者审查建议；实际责任仍在接纳变更的人和团队。

## 工作机制 | How it works

先把任务缩小到可验收结果，例如“超时后返回现有错误类型，并保持成功响应格式”，而不是“改好这个服务”。随后提供最相关的代码、调用方式、版本信息和边界条件，并指出哪些文件或操作不可触碰。让模型先解释理解或列出假设，可以在编辑前发现缺失信息；实施时一次改动一个清楚的范围，并要求说明修改点。开发者随后逐行看差异，检查错误处理、依赖、授权与数据边界，运行针对性测试，再按风险运行更广的检查。失败输出要回到具体断言或日志分析，不能仅靠让模型重试直到它声称通过。保存任务说明、模型或工具版本、测试命令和结果，可以让后续审查重现过程。

## 一个例子 | A worked example

例如，某 API 请求需要在三秒后超时，但目前会一直等待。开发者给出处理函数、超时错误的既有类型，以及“不得自动重试写请求”的约束，并要求补一项回归测试。AI 工具可以定位调用链，提出带超时控制和测试的补丁。开发者要确认超时是否覆盖正确的网络阶段、错误是否仍符合调用方契约、重试有没有改变副作用，然后运行新增测试和已有相关测试。测试通过只说明这些断言在当前环境成立；代码审查仍需判断未测试路径与安全影响。

## 局限与误解 | Limits and misconceptions

生成代码可能调用不存在的接口、忽略仓库约定、引入安全缺陷，或把测试写成只验证自身假设。过大的上下文可能混入无关信息并暴露敏感材料；过少的上下文则会漏掉跨文件契约。AI 工具可以减少某些查找与草拟工作，也会增加提示、等待、审查和纠错成本，因此不能由“生成更快”直接推断整体交付更快。[Becker 等人 2025 年的随机对照研究](https://arxiv.org/abs/2507.09089)让 16 位熟悉成熟开源项目的开发者完成 246 项任务，报告在其研究设置下允许使用当时的 AI 工具反而使完成时间增加 19%；该结果只适用于该样本与任务，不能代表所有团队或工具。AI 辅助开发也不能取代版本控制、测试、安全审查和领域知识。对权限有限、风险高或需求不清的变更，应先澄清、隔离并由人确认。

## 相关标本 | Related specimens

[大语言模型如何生成](/entries/llm-generation)解释建议从何而来，[Agent 架构](/entries/agent-architecture)解释工具如何进入执行循环；[AI 评测](/entries/ai-evaluation)讲行为证据，[测试与调试](/entries/testing-debugging)则帮助验证具体补丁。

:::

:::en
**AI-assisted development** is a way for developers to work with AI tools on bounded tasks such as explaining a requirement, comparing approaches, writing code, refactoring, or drafting tests, while keeping ownership of the requirement, verification, and final decision. The unit of useful work is not the amount of generated code, but a reviewable change with evidence. Its curatorial natural-history counterpart is *Cyanocitta cristata*, the blue jay; the pairing is only part of the catalogue.

## 定义与边界 | Definition and boundaries

The developer defines the problem, constraints, acceptance criteria, and risks. An AI tool uses the context it receives to produce an explanation, suggestion, or patch. Context might include relevant source files, an error message, interface contracts, and tests; it need not include an entire repository or unauthorized secrets. A model may return text only, or an editor or agent may let it read and edit files and run commands. Tool permissions determine what it can do; they do not make its output correct. Real repository tasks can also be evaluated: [SWE-bench](https://arxiv.org/abs/2310.06770) uses GitHub issues, codebases, and fixes to assess software-engineering work. GitHub’s [responsible-use guidance for Copilot code completion](https://docs.github.com/en/copilot/responsible-use-of-github-copilot-features/responsible-use-of-github-copilot-code-completion) advises users to review suggestions. The person and team accepting a change remain responsible for it.

## 工作机制 | How it works

Start with a small, testable outcome, such as “return the existing error type after a timeout while preserving the success response format,” rather than “fix this service.” Give the tool the relevant code, call pattern, version information, and boundary conditions, and state which files or actions are out of scope. Asking it to explain its understanding or assumptions can reveal missing information before an edit. Make one clear change at a time and ask for a description of what changed. Then inspect the diff line by line, check error handling, dependencies, authorization, and data boundaries, and run focused tests followed by broader checks when the risk warrants them. Return failures to the exact assertion or log; do not keep retrying merely until the tool says it passed. Recording the task, model or tool version, commands, and results makes the process easier to reproduce in review.

## 一个例子 | A worked example

Suppose an API request should time out after three seconds but currently waits without a limit. The developer supplies the handler, the established timeout error type, and a constraint against automatically retrying writes, then asks for a regression test. An AI tool can trace the call and propose a patch with a timeout and test. The developer checks whether the timeout covers the intended network phase, whether the error still satisfies the caller’s contract, and whether retries could repeat a side effect. The new and relevant existing tests are then run. Passing tests show that those assertions held in the current environment; a code review still has to consider untested paths and security effects.

## 局限与误解 | Limits and misconceptions

Generated code may call a nonexistent interface, ignore repository conventions, introduce a security flaw, or encode only the assumptions already present in its tests. Too much context can add irrelevant material and expose sensitive information; too little can hide contracts across files. AI tools can reduce some search and drafting work, but they also add prompting, waiting, review, and correction costs. Faster generation therefore does not prove faster delivery overall. In a [2025 randomized controlled study](https://arxiv.org/abs/2507.09089), Becker et al. asked 16 developers familiar with mature open-source projects to complete 246 tasks. They reported that allowing the early-2025 AI tools in their study increased completion time by 19%. That result is specific to the study’s participants and tasks, not a prediction for every team or tool. AI assistance does not replace version control, tests, security review, or domain knowledge. For changes with broad permissions, high risk, or unclear requirements, clarify and isolate the task and have a person confirm the result.

## 相关标本 | Related specimens

[How Language Models Generate](/entries/llm-generation) explains where suggestions come from, and [Agent Architecture](/entries/agent-architecture) explains how tools enter an execution loop. [AI Evaluation](/entries/ai-evaluation) covers behavioural evidence; [Testing and Debugging](/entries/testing-debugging) helps verify a specific patch.

:::
