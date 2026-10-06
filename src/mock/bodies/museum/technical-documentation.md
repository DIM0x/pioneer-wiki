:::zh
**技术文档：让读者理解并行动**把系统知识组织成读者能够学习、执行、查询或判断的材料。策展对应物为 *Julidochromis ornatus*，仅保留分类关联，不从物种推导文档或协作规律。

## 定义与边界 | Definition and boundaries

技术文档是产品接口的一部分：它传达读者完成任务所需的事实、步骤、约束和解释。它不是源代码的逐句复述，也不是单纯的宣传文案。不同问题需要不同文档形态。教程带读者通过一条完整路径获得初步能力；操作指南针对已有目标给出完成步骤；参考文档准确列出接口、参数、状态或行为；解释性文章帮助读者建立为什么如此设计的心智模型。Diátaxis 将这四类读者需求作为组织文档的框架，提醒作者不要把学习、执行、查阅与理解混成一种页面。[C1]

文档质量应围绕目标用户与任务评价：读者是否可以在合适的前置条件下完成操作、定位限制、确认结果并安全恢复。准确、可发现、可访问和及时同样重要。页面简洁并不自动清楚；遗漏前置条件会让“简短步骤”在真实环境中失败。

## 工作机制 | How it works

写作前先界定读者、目标、环境、前置条件与成功信号。操作指南以动词开头，按用户真正执行的顺序排列步骤，每步说明输入、动作和可观察结果；将危险、不可逆或依赖权限的步骤提前标明。教程保持一条小而完整的成功路径，用可复制的例子展示中间状态。参考文档覆盖有效选项、默认值、边界情况和错误条件；解释性内容说明设计权衡与适用边界，而不是伪装成步骤清单。

标题应让读者预测页面能解决什么问题。使用清楚的小节、真实代码示例、明确术语和一致命名；复杂概念先给短定义，再逐步引入细节。Google Developer Documentation Style Guide 建议使用完整且唯一的标题，并把页面结构组织成易扫描的内容；这些规则提升可读性，但不能替代领域专家对事实的审查。[C2] 每个范例应在目标版本和支持环境中实际运行，命令输出、链接和截图应与最终步骤一致。将改动者与审阅者分开可以发现隐含假设。

## 一个例子 | A worked example

假设读者要接入一个分页 API。教程可创建最小客户端、请求第一页、读取游标并取得下一页；操作指南聚焦“导出本月结果”；参考页定义 `cursor`、`limit`、错误码和最大值；解释文档说明游标分页为何在数据持续插入时比偏移分页更稳定，以及它的排序约束。这样读者不用在一篇文章里同时寻找学习路径、临时任务、字段定义和架构理由。部署说明还应给出权限范围、速率限制、重复请求行为和调试方法，并指出如何删除测试数据。

发布前让目标读者照文档执行，不提示隐藏步骤。记录卡住的位置、错误理解和环境差异，再修正内容。检查链接、版本、可访问性、代码格式、复制体验和屏幕阅读器标题层次。文档属于软件变更，应和接口及发布节奏一同更新。

## 局限与误解 | Limits and misconceptions

四类框架是组织工具，不是要求每个页面机械分成四段。有些主题天然需要多种文档相互链接；过度拆页也会使读者迷路。示例可能随版本过期，命令成功运行也不能证明解释完整。读者知识、地区法规、权限和平台环境各不相同；一份文档不一定适合所有人。用户反馈能暴露问题，却受样本选择影响。关键安全步骤、兼容性和数据损失后果仍需专门审查，自动拼写或链接检查无法替代。

## 相关标本 | Related specimens

参见[有效学习](/entries/effective-learning)思考读者如何练习和延迟回忆，[从笔记到知识网络](/entries/notes-to-knowledge)管理文档关联，并通过[技术讨论](/entries/technical-discussion)收集真实问题与误解。Diátaxis 与 Google 的写作指南提供结构和风格原则；事实正确性、任务完成率与读者情境仍须单独验证 [S1, S2]。
:::

:::en
**Technical Documentation: Helping Readers Understand and Act** organizes system knowledge into material that lets readers learn, perform, look up, or reason about a task. Its editorial taxonomic counterpart is *Julidochromis ornatus*, retained only as a catalogue association; no documentation or collaboration principle is derived from the species.

## 定义与边界 | Definition and boundaries

Technical documentation is part of a product's interface. It communicates the facts, steps, constraints, and explanations a reader needs to accomplish a task. It is neither a line-by-line restatement of source code nor merely promotional copy. Different questions call for different forms. A tutorial guides a learner through a complete path toward initial competence. A how-to guide gives the steps for a specific goal to a reader who already has one. Reference documentation accurately lists an interface, parameter, state, or behavior. An explanation helps readers build a mental model of why a design works as it does. Diátaxis uses these four kinds of reader need as an organizing framework and cautions against mixing learning, task completion, lookup, and understanding into one undifferentiated page [C1].

Assess documentation against the target reader and task: can a reader meet the prerequisites, complete the operation, find constraints, confirm the result, and recover safely? Accuracy, discoverability, accessibility, and freshness matter as well. A short page is not automatically clear; omitted prerequisites can make concise steps fail in an actual environment.

## 工作机制 | How it works

Before drafting, define the reader, goal, environment, prerequisites, and visible success signal. Begin how-to steps with actions and put them in the order a user should perform them. Each step should make clear what input is needed, what action to take, and what result to observe. Identify dangerous, irreversible, or permission-dependent steps before the reader reaches them. Keep a tutorial on one small but complete successful path and use a reproducible example to show intermediate state. Reference material should cover valid options, defaults, edge cases, and error conditions. Explanatory material should state trade-offs and boundaries rather than masquerade as a procedure.

Headings should let readers predict the question a page will answer. Use clear sections, realistic code examples, defined terminology, and consistent names. Introduce a complex idea with a short definition before adding detail. Google's Developer Documentation Style Guide recommends complete, unique headings and scannable page structure; these improve readability but do not replace domain experts checking the facts [C2]. Run every example against the supported version and environment, and keep command output, links, and screenshots consistent with the final procedure. Having someone other than the author review a change can expose hidden assumptions.

## 一个例子 | A worked example

Suppose readers need to integrate a paginated API. A tutorial can build a minimal client, request the first page, read a cursor, and request the next page. A how-to can focus on “export this month's results.” A reference page can define `cursor`, `limit`, error codes, and maximum values. An explanation can show why cursor pagination can be more stable than offset pagination while records are inserted, and state its ordering constraints. Readers no longer need to search one article for a learning path, an immediate task, field definitions, and architectural rationale. Deployment guidance should also state permission scope, rate limits, duplicate-request behavior, debugging steps, and how to remove test data.

Before release, ask a target reader to follow the documentation without hidden hints. Record where they stop, what they misunderstand, and how their environment differs, then revise the text. Check links, versions, accessibility, code formatting, copy-and-paste behavior, and heading levels for screen readers. Documentation is a software artifact and should change with interfaces and releases.

## 局限与误解 | Limits and misconceptions

The four-part framework is an organizing tool, not a requirement that every page be divided into four sections. Some subjects naturally need several linked forms; excessive page splitting can also make readers lose their way. Examples can become outdated, and a command that still runs does not prove its explanation is complete. Readers differ in prior knowledge, jurisdiction, permissions, and platform, so one page may not serve everyone. Feedback can reveal failures but is affected by who chooses to report them. Security-critical steps, compatibility, and data-loss consequences still need focused review; automated spelling or link checks cannot provide that assurance.

## 相关标本 | Related specimens

See [Effective Learning](/entries/effective-learning) for how readers practise and recall material later, [From Notes to Knowledge Networks](/entries/notes-to-knowledge) for managing related material, and [Technical Discussion](/entries/technical-discussion) for learning from real questions and misunderstandings. Diátaxis and Google's style guide provide structure and style principles; factual accuracy, task success, and reader context need separate verification [S1, S2].
:::
