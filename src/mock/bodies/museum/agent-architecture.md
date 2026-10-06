:::zh
**Agent 架构**是把语言模型放进一个可控的软件回路中，让模型根据当前状态选择下一步、调用工具并依据结果继续或结束的设计。仅调用一次模型回答问题，通常还没有形成 Agent；关键在于模型输出能否改变后续执行，以及外围程序怎样保留状态、限制权限和管理终止条件。本文的博物学对应物是 **Garrulus glandarius**（松鸦），仅为策展配对。

## 定义与边界 | Definition and boundaries

本文把 Agent 定义为由模型、运行时和外部能力共同构成的目标导向系统。模型根据用户请求和当前上下文提出回答或结构化动作；运行时检查动作格式与授权，然后调用工具；工具结果作为新的观察回到上下文。这个“观察—动作—结果”回路可执行多步任务，但具体实现并无唯一标准定义。[ReAct 论文](https://arxiv.org/abs/2210.03629)研究了语言模型交错地产生推理与行动；[Anthropic 的 Agent 工程指南](https://www.anthropic.com/engineering/building-effective-agents)则区分预设步骤的工作流和让模型动态决定控制流的 Agent。是否要动态控制，应是设计选择，不是贴上 Agent 标签就自动获得的能力。

## 工作机制 | How it works

一个常见架构包含六个部分：接收目标并整理输入的入口；模型及其系统指令；可调用工具的名称、说明和参数格式；执行工具并实施权限检查的宿主运行时；记录任务状态和工具观察的存储；以及决定继续、交还给用户或终止的控制器。模型可以返回普通文本，也可提出工具调用请求，但通常由应用解析请求、验证参数并真正执行工具，再把执行结果交还模型。[OpenAI 的函数调用指南](https://platform.openai.com/docs/guides/function-calling)明确展示了这一应用侧往返过程。状态可以只存在于一次对话，也可由应用持久化；两者都不等于模型权重本身拥有长期记忆。

循环应有明确预算和退出条件：最多执行多少步骤、哪些工具允许写入、遇到缺少参数时是否澄清、工具超时是否重试、哪些副作用需要人确认。工作流还需处理重复调用、部分失败和过期观察。例如，付款或发布操作不能因为模型重复提出同一动作就无条件执行；工具调用应有幂等键、权限门槛或人工确认。外部工具返回的网页、文件和代码应视为不可信数据；[OWASP 的提示注入风险说明](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)解释了为何其中嵌入的指令不能越权改变系统规则。

## 一个例子 | A worked example

假设用户要求修复一个日期解析错误，并给出“接受 ISO 日期、拒绝不可能日期、保留旧格式”三条标准。Agent 先读取指定模块和相关测试，随后提出一个范围有限的补丁；宿主只允许它在工作区改文件，并运行相关测试。若测试发现旧格式回归，结果会回到模型上下文，模型可继续修正或报告阻塞。最后由人查看差异、测试结果和边界行为，再决定是否合并。这个例子使用了模型选择下一步的循环，但修改范围、工具权限、测试命令和最终合并权仍由软件与人设定。

## 局限与误解 | Limits and misconceptions

多一步工具调用就多一种失败模式：模型可能选错工具、填错参数、误读返回值，或在状态不完整时继续计划。外部数据还可能包含提示注入；因此应把用户请求、系统规则、工具结果和模型建议分层处理，并采用最小权限、参数验证、超时、速率上限和可审计日志。重试策略需要考虑幂等性，否则失败恢复本身会造成重复写入。长期记忆会带来过时、冲突和隐私问题，必须定义保存、更新、删除与来源追踪。Agent 不是必然比固定工作流更强：对于确定、短小、易测试的任务，预设步骤通常更容易预测和检查；动态规划只有在任务确实需要根据中间结果调整时才可能有价值。重要的外部副作用应由明确授权或人工确认保护。

## 相关标本 | Related specimens

[大语言模型如何生成](/entries/llm-generation)说明模型在一步中的 Token 预测；本篇说明应用如何把多步模型输出接入工具、状态和执行控制。[AI 辅助开发](/entries/ai-assisted-development)展示一种面向软件修改的工作流，[AI 评测](/entries/ai-evaluation)提供检验 Agent 任务成功率和失败类型的方法。

:::

:::en
**Agent architecture** places a language model inside a controlled software loop in which it can choose a next step, request a tool, and continue or stop in light of the result. A single model call that answers a question is usually not an agent by itself. The defining design question is whether a model output can change subsequent execution and how the surrounding application preserves state, limits authority, and decides when work ends. Its curatorial natural-history counterpart is *Garrulus glandarius*, the Eurasian jay; the pairing is only part of the catalogue.

## 定义与边界 | Definition and boundaries

Here, an agent is a goal-directed system composed of a model, a runtime, and external capabilities. Given a request and current context, the model proposes a response or structured action. The runtime checks its format and authorization, calls a tool, and returns the result as a new observation. This observation–action–result loop can support multi-step work, but there is no single implementation standard implied by the word “agent.” The [ReAct paper by Yao et al.](https://arxiv.org/abs/2210.03629) studies language models that interleave reasoning traces and actions. [Anthropic’s engineering guide](https://www.anthropic.com/engineering/building-effective-agents) distinguishes workflows with predefined paths from agents in which a model dynamically directs control flow. Dynamic control is a design choice; using the label does not create the capability.

## 工作机制 | How it works

A common architecture has six parts: an entry point that receives the goal and prepares input; a model with system instructions; tool descriptions and parameter schemas; a host runtime that executes tools and checks permissions; storage for task state and observations; and a controller that continues, returns to the user, or terminates. The model may return ordinary text or request a structured tool call. In a typical API loop, the application parses the request, validates its arguments, executes the tool, and sends the result back to the model. This application-side round trip is described in [OpenAI’s function-calling guide](https://platform.openai.com/docs/guides/function-calling). State may last only for a conversation or be persisted by the application; neither case means that model weights themselves have durable memory.

The loop needs explicit budgets and exit rules: maximum steps, tools allowed to write, whether missing parameters require clarification, how timeouts are handled, and which side effects need human approval. It must also handle duplicate calls, partial failures, and stale observations. A payment or publishing action, for example, should not execute unconditionally just because the model proposed it twice. Idempotency keys, permission checks, or confirmation can prevent a retry from repeating a side effect. Web pages, files, and code returned by tools are untrusted data, not new system instructions; [OWASP’s prompt-injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) explains why embedded text must not override application rules.

## 一个例子 | A worked example

Suppose a user asks for a date-parsing bug fix and gives three acceptance criteria: accept ISO dates, reject impossible dates, and preserve an older format. An agent can inspect the named module and related tests, then propose a narrowly scoped patch. The host permits edits only in the workspace and runs the relevant tests. If a test reveals a regression in the older format, that result returns to the model as context, and the model can revise its proposal or report the blocker. A person then reviews the diff, test result, and boundary cases before deciding whether to merge. The model participates in choosing the next step, but the software and person still determine the edit scope, tool permissions, test command, and final merge authority.

## 局限与误解 | Limits and misconceptions

Every tool call adds failure modes: the model can select the wrong tool, provide invalid arguments, misread a result, or continue from incomplete state. External data can also contain prompt injection. Separate user requests, system rules, tool results, and model suggestions; enforce least privilege, argument validation, timeouts, rate limits, and auditable logs. Retry policy must account for idempotency so that recovery does not repeat a write. Persistent memory introduces stale, conflicting, and private data, so retention, correction, deletion, and provenance need explicit rules. An agent is not automatically stronger than a fixed workflow. For a short, deterministic, testable task, predefined steps are often easier to predict and inspect. Dynamic planning may help when the next step truly depends on intermediate results. Important external side effects should require explicit authorization or human confirmation.

## 相关标本 | Related specimens

[How Language Models Generate](/entries/llm-generation) explains next-token prediction within one model step; this entry explains how an application connects multiple steps to tools, state, and execution control. [AI-assisted Development](/entries/ai-assisted-development) describes one workflow for changing software, while [AI Evaluation](/entries/ai-evaluation) offers methods for checking agent success rates and failure types.

:::
