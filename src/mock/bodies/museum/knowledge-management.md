:::zh
**知识管理**是帮助个人或组织捕获、组织、分享、检索并更新工作所需知识的实践组合。它既涉及文档、案例和数据，也涉及经验如何在协作中传递、责任如何分配以及知识何时失效。建立一个知识库只是其中一种工具，不能代替维护流程和使用情境。[S1][S2]
:::

:::en
**Knowledge management** is a set of practices that helps people and organizations capture, organize, share, retrieve, and update knowledge needed for their work. It includes documents, cases, and data, but also how experience moves through collaboration, who is responsible for it, and when it becomes obsolete. A knowledge base is one tool within that practice; it cannot replace maintenance processes or context of use. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
显性知识可以写成规范、决策记录和流程；隐性知识常存在于熟练者的判断、技巧和情境经验中，未必能完整转成文档。知识管理因此不等于“把所有东西存起来”，而是让重要信息在需要时找得到、能判断可信度，并有途径确认其当前有效。分类体系、元数据、版本、负责人和访问权限都影响这一结果。若知识包含个人或机密信息，还需明确采集目的、保留期限与授权边界。[S1]
:::

:::en
Explicit knowledge can be written as procedures, decision records, and workflows. Tacit knowledge often resides in a skilled person's judgment, technique, and situational experience and may not transfer fully into documentation. Knowledge management is therefore not “store everything.” It aims to make important information findable when needed, assessable for trustworthiness, and subject to checks for current validity. Classification, metadata, versions, owners, and access controls all affect that outcome. When knowledge includes personal or confidential information, the purpose of collection, retention period, and authorization boundary must also be clear. [S1]
:::

## 工作机制 | How it works

:::zh
可持续的循环包括识别关键知识、选取适当记录形式、给出来源与上下文、建立可检索结构、在实际任务中复用，再根据反馈修订或归档。决策记录要说明当时可用证据和取舍；操作手册应标注适用版本和负责人；案例可用标签连接相关故障、修复和结果。定期复核、到期提示和下线流程减少过时内容。工作坊、结对和复盘等方式适合传递不易文档化的经验，搜索与权限系统则支持分散团队共享。[S1][S2]
:::

:::en
A sustainable cycle identifies critical knowledge, chooses an appropriate record format, captures sources and context, creates a retrievable structure, reuses the material in real work, then revises or archives it based on feedback. A decision record should state the evidence and trade-offs available at the time. A runbook should name the applicable version and owner. A case can link a failure, a repair, and an outcome through shared tags. Periodic review, expiration reminders, and retirement procedures reduce stale content. Workshops, pairing, and retrospectives help transfer experience that is hard to document, while search and permissions support sharing across distributed teams. [S1][S2]
:::

:::zh
实践中的贡献路径也要融入日常工作：简短模板、明确负责人、源材料链接和轻量复核，比另起一个文档项目更容易持续。检索质量应使用目标读者的真实问题检查，也包括当前没有答案的情况。明确标注“尚无记录”或“需要复核”，可以避免不确定页面显得权威。
:::

:::en
A practical system also needs a contribution path that fits ordinary work: short templates, clear ownership, links to source artifacts, and a lightweight review cadence are easier to sustain than a separate documentation project. Search quality should be checked with real questions from the intended audience, including cases where no current answer exists. A deliberate “not documented” or “needs review” status can prevent an uncertain page from appearing authoritative.
:::

## 一个例子 | A worked example

:::zh
值班团队每次处理服务故障后，把时间线、受影响服务、观测信号、缓解措施和未解决问题写入复盘记录，并链接到告警手册和相关代码变更。记录标注系统版本、责任人和复查日期；如果根因尚不确定，就把假设与确认事实分开。下一位值班者可以从告警入口检索类似事件，判断旧措施是否仍适用，再补充新的结果。知识库价值来自“找到并正确使用”，不只是存入文档。
:::

:::en
After each service incident, an on-call team records a timeline, affected services, observed signals, mitigations, and unresolved questions. The review links to runbooks and relevant code changes, and names the system version, owner, and review date. If the root cause is uncertain, hypotheses are separated from confirmed facts. The next on-call engineer can search from an alert, judge whether an earlier mitigation still applies, and add the new outcome. The knowledge base creates value when information is found and used correctly, not merely when a document is stored.
:::

## 局限与误解 | Limits and misconceptions

:::zh
文档数量、页面浏览量或搜索次数都不是知识真正被理解和复用的证明。过度分类会让贡献者难以入库，过度简化则让细节和反例消失；开放编辑提高更新速度，也可能增加未经验证的建议。知识会随软件版本、法规和组织变化而过时，因此需要来源、日期、所有者和反馈通道。将个人经验强行形式化，还可能暴露隐私或抹去情境。衡量时应关注任务是否更快完成、错误是否减少和知识能否迁移，而不是只追求“更多内容”。[S1][S2]
:::

:::en
Document counts, page views, and search frequency do not prove that knowledge was understood or reused. Too much categorization makes contribution difficult; too little can erase detail and counterexamples. Open editing speeds updates but can also spread unverified advice. Knowledge becomes stale as software versions, regulations, and organizations change, so records need sources, dates, owners, and a feedback channel. Formalizing personal experience can expose private information or strip away context. Measures should ask whether tasks finish faster, errors decline, and knowledge transfers to new situations, rather than rewarding volume alone. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[信息检索](/entries/information-retrieval)说明如何在知识集合中查找相关内容；[数据库](/entries/databases)提供结构化存储和权限控制；[技术文档](/entries/technical-documentation)讨论面向读者任务编写和维护文档。
:::

:::en
[Information Retrieval](/entries/information-retrieval) explains how to find relevant content in a knowledge collection. [Databases](/entries/databases) provide structured storage and access control. [Technical Documentation](/entries/technical-documentation) covers writing and maintaining documents around readers' tasks.
:::

## 参考资料 | References

:::zh
- [S1] NASA APPEL Knowledge Services，Knowledge Management 与 Lessons Learned 服务说明。[NASA 页面](https://appel.nasa.gov/knowledge-management/)
- [S2] W3C，*SKOS Simple Knowledge Organization System Reference*，概念方案、标签和语义关系。[规范](https://www.w3.org/TR/skos-reference/)
:::

:::en
- [S1] NASA APPEL Knowledge Services, overview of Knowledge Management and Lessons Learned services. [NASA page](https://appel.nasa.gov/knowledge-management/)
- [S2] W3C, *SKOS Simple Knowledge Organization System Reference*, concept schemes, labels, and semantic relations. [Specification](https://www.w3.org/TR/skos-reference/)
:::
