:::zh
**协作中的分工、共享与责任**讨论多人如何协调依赖、共同产出并对结果负责。策展对应物为 *Neolamprologus pulcher*，仅为分类目录关系，不把鱼类社会行为映射为团队管理规律。

## 定义与边界 | Definition and boundaries

协作不是把工作拆开后各自完成再合并，而是成员围绕共享目标协调信息、决策、依赖和交接。分工需要明确产物与接口；共享需要让相关决策和上下文可被其他人找到；责任则要说明谁可以决定、谁执行、谁复核以及风险由谁升级。角色不必完全相同，但责任不应因“大家都在看”而消失。团队效能也不能只用任务数量衡量，还要看质量、返工、风险暴露和成员能否持续工作。

团队研究可帮助形成机制假设，但证据的适用范围有限。Salas 等人综合团队研究提出领导、相互监控、备援行为、适应性和团队导向等核心成分，并指出共同心智模型、闭环沟通和信任等协调机制的重要性会随任务阶段变化。[C1] Edmondson 对一家制造企业 51 个团队开展多方法现场研究，发现团队心理安全与学习行为相关，学习行为又与团队绩效相关；这是组织情境中的关联证据，不保证在任意团队都产生同样结果。[C2]

## 工作机制 | How it works

开始前写清目标、完成定义、接口、决策权和已知依赖。把任务拆到可以观察进度的交付物，给每项任务一个负责推进的人，同时列出需要咨询、审批或接收结果的人。共享文档应记录决定、理由、未决问题和变更日期，而非只上传最终附件。交接时传递状态、下一步、阻塞和回滚方案；信息应进入团队可查找的工作空间，避免只有某个成员掌握上下文。

团队节奏要支持同步和异步两种协作。短会适合解决相互依赖或需要共同决策的问题，状态更新可异步书面完成。闭环沟通意味着接收者复述或确认关键请求，发送方确认理解一致。定期检查进度偏差、负荷和外部依赖；当某人被阻塞时，备援意味着成员能够调整工作或协助完成，而不是长期把单点知识合理化。错误报告和不同意见应有安全通道，并以具体事实讨论问题，而非推断个人动机。

## 一个例子 | A worked example

四人团队上线一个导出功能：产品负责人确定隐私和格式要求，后端工程师定义分页 API，前端工程师实现下载流程，测试负责人覆盖权限、超时和大文件场景。每项工作有交付负责人，但 API 变更要同步给前端与测试；发布前由另一位成员检查授权和回滚计划。工作板记录阻塞与决策链接，发布值班人员可看到错误率阈值和暂停开关。若测试发现跨租户导出，优先停止发布并保留证据，之后复盘接口约定为何遗漏。角色划分让协作责任清楚，而不是替代互相核查。

## 局限与误解 | Limits and misconceptions

心理安全不是降低标准或避免问责，而是成员能够提出问题、报告错误并挑战假设，同时仍对工作负责。关系研究不能独立证明因果，组织层面的结果也不能直接外推到远程团队、短期项目或高风险临床协作。增加会议不等于增加共享，过度透明也可能暴露个人信息或使成员被持续打断。角色矩阵会随项目变化，责任分散会随人员离开而出现空洞；团队必须让职责和交接文件持续更新。工具无法替代公平的决策过程或实际的信任。

## 相关标本 | Related specimens

参见[有效代码评审](/entries/effective-code-review)把协作中的反馈落到变更证据，[技术文档](/entries/technical-documentation)保存可交接的上下文，以及[技术讨论](/entries/technical-discussion)建立提出问题和异议的方式。Salas 等人的团队框架和 Edmondson 的现场研究提供互补视角，但适用性要结合任务、行业、团队历史与组织结构判断 [S1, S2]。
:::

:::en
**Collaborative Work: Roles, Sharing and Responsibility** considers how people coordinate dependencies, produce a shared result, and remain accountable for it. Its editorial taxonomic counterpart is *Neolamprologus pulcher*, a catalogue relationship only; fish social behaviour is not used as a model for team management.

## 定义与边界 | Definition and boundaries

Collaboration is more than splitting work into independent pieces and merging them at the end. Members coordinate information, decisions, dependencies, and handoffs around a shared goal. Division of work needs clear outputs and interfaces. Sharing makes relevant decisions and context available to others. Responsibility states who may decide, who executes, who checks, and who escalates risk. Roles can differ, but accountability should not disappear because “everyone was looking.” Team effectiveness is not just a count of completed tasks; quality, rework, exposed risk, and the team's ability to sustain work also matter.

Team research can inform hypotheses about mechanisms, but its evidence has boundaries. Salas and colleagues synthesized teamwork research into components including leadership, mutual performance monitoring, backup behavior, adaptability, and team orientation. They also describe coordinating mechanisms such as shared mental models, closed-loop communication, and mutual trust, whose importance varies over a team's task and its stages [C1]. Edmondson's multimethod field study of 51 teams in one manufacturing company found psychological safety associated with learning behavior and learning behavior associated with team performance [C2]. This is evidence from an organizational setting, not a guarantee that the same relationships will hold in every team.

## 工作机制 | How it works

Before work begins, state the goal, completion criteria, interfaces, decision rights, and known dependencies. Break the work into deliverables whose progress can be observed. Give each item a person responsible for moving it forward and identify people who need to advise, approve, or receive its result. Shared documents should record decisions, reasons, unresolved questions, and dates of change rather than only the final attachment. At a handoff, communicate the current state, next action, blocker, and rollback path. Put context in a findable team workspace so it does not remain with one individual.

Team rhythms should support both synchronous and asynchronous work. A short meeting can resolve dependencies or a decision that benefits from live discussion; routine status can be written asynchronously. Closed-loop communication means the receiver confirms a consequential request and the sender verifies that it was understood. Review progress, workload, and external dependencies regularly. Backup behavior lets members adapt or help unblock work instead of normalizing a single point of knowledge. Provide a safe path for reporting errors and disagreements, then discuss specific evidence rather than guessing at a colleague's motives.

## 一个例子 | A worked example

A four-person team is releasing an export feature. The product owner defines privacy and format requirements; a backend engineer specifies pagination; a frontend engineer implements the download flow; and a test lead covers authorization, timeouts, and large files. Each deliverable has an owner, while API changes are shared with frontend and testing. Before release, another team member checks authorization and rollback plans. A work board links blockers to decisions, and the on-call person can see the error-rate threshold and pause control. If testing finds a cross-tenant export, the team stops release and preserves the evidence, then examines why the interface contract missed the rule. Role clarity makes collaboration accountable; it does not replace mutual checking.

## 局限与误解 | Limits and misconceptions

Psychological safety is not lower standards or freedom from accountability. It means members can ask questions, report errors, and challenge assumptions while remaining responsible for their work. Relational research does not by itself prove causation, and findings from an organization cannot automatically be generalized to remote teams, short projects, or high-risk clinical collaboration. More meetings do not ensure more sharing, and excessive transparency can expose personal information or interrupt people continuously. Role matrices change as projects change, while departures can leave silent gaps; responsibilities and handoff records need regular updates. A tool cannot replace fair decision-making or actual trust.

## 相关标本 | Related specimens

See [Effective Code Review](/entries/effective-code-review) for connecting feedback to change evidence, [Technical Documentation](/entries/technical-documentation) for preserving transferable context, and [Technical Discussion](/entries/technical-discussion) for ways to raise questions and disagreements. Salas and colleagues' teamwork framework and Edmondson's field study offer complementary views, but applicability depends on task, industry, team history, and organizational structure [S1, S2].
:::
