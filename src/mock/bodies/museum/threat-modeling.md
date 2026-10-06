:::zh
**威胁建模：从资产到防护措施**是一种结构化分析，用来在设计和运行过程中识别系统的重要资产、信任边界、可能的威胁及相应处置。策展对应物为 *Rhinoclemmys pulcherrima*，只作为分类目录关联，不描述其生物学行为。

## 定义与边界 | Definition and boundaries

威胁模型是关于特定系统、使用情境和攻击者能力的可修订假设集，不是一次会议后永久完成的清单，也不是安全认证。它帮助团队回答：保护什么、系统如何与外部主体交互、哪里可能出错，以及哪些风险要降低、接受、转移或避免。OWASP 将常见过程概括为系统分解、威胁识别与排序、缓解、复查和验证；同时明确没有适用于每个场景的唯一行业标准。[C1]

范围需要可管理：写下被评估的版本、主要数据流、外部依赖、假定用户和不纳入事项。模型应覆盖机密性、完整性、可用性，以及身份伪造、操作抵赖和隐私影响等与系统有关的属性。威胁指能够造成损害的情景，漏洞是使情景可发生的弱点，风险还要结合可能性、影响与不确定性判断；三者不能混为同一列表项。

## 工作机制 | How it works

先画出系统模型：组件、数据流、存储、外部服务和信任边界。每个跨边界的数据流要说明谁发起、数据敏感度、如何认证与保护。然后枚举资产和滥用目标，使用 STRIDE 等分类提示检查欺骗、篡改、抵赖、信息泄露、拒绝服务和权限提升。分类只是提示，不是威胁自动发现器；隐私风险、业务流程滥用或供应链问题可能需要其他方法。

为每个具体情景记录前置条件、受影响资产、攻击路径、影响、现有控制、风险判断、负责人和待验证措施。排序可用严重度矩阵或攻击树辅助，但分值取决于团队对可能性和影响的假设，应把假设与证据标出。优先提出可以验证的控制，例如“跨租户请求不能读取其他租户对象”，并让需求转成负向访问测试、日志规则或恢复能力。微软威胁建模工具资料也把建模作为产品生命周期里的分析和协作过程，而非仅输出图表。[C2]

## 一个例子 | A worked example

考虑一个允许用户上传发票并由异步工作器提取字段的服务。数据流图应包括浏览器、上传 API、对象存储、队列、解析器、数据库和第三方 OCR。信任边界至少出现在客户端到 API、API 到队列、工作器到外部 OCR。威胁情景可以是伪造用户访问他人发票、恶意文件触发解析器漏洞、重复消息产生重复付款、队列被洪泛造成服务不可用，或日志泄露发票中的个人信息。相应控制分别可能是对象级授权、文件格式和大小限制、隔离解析、幂等键和速率上限，以及日志字段最小化。每个控制都要指向一项可复现测试和明确的责任人。

## 局限与误解 | Limits and misconceptions

模型质量取决于架构图是否真实、参与者是否覆盖运营与业务，以及攻击者能力假设是否明确。STRIDE 并不穷尽所有风险；风险矩阵提供排序辅助，却不是精确概率。将工具生成的项目全数当作真实漏洞会产生噪声，只勾选清单也会产生虚假的完成感。云服务配置、版本和数据用途改变后，旧图可能失效。威胁建模不替代代码审计、渗透测试、事故演练或合规评估，发现项还须落到负责人、期限与可验证结果上。

## 相关标本 | Related specimens

参见[身份认证与授权](/entries/authentication-authorization)把信任边界落到逐请求策略，[加密、哈希与签名](/entries/encryption-hashing-signatures)选择具体数据保护保证，并用[数据最小化与访问控制](/entries/data-minimization)压缩可遭暴露的数据范围。OWASP 指南和 Microsoft Learn 工具概述各提供一套实践视角；实际方法应匹配系统规模、隐私需求和组织流程 [S1, S2]。
:::

:::en
**Threat Modeling: From Assets to Protective Measures** is a structured analysis for identifying important assets, trust boundaries, plausible threats, and responses as a system is designed and operated. Its editorial taxonomic counterpart is *Rhinoclemmys pulcherrima*, retained only as a catalogue relationship and not used to make a biological claim.

## 定义与边界 | Definition and boundaries

A threat model is a revisable set of assumptions about a specific system, its use, and an adversary's capabilities. It is not a permanent checklist completed in one meeting or a security certification. It helps a team answer what needs protection, how the system interacts with outside parties, where things could go wrong, and whether a risk should be reduced, accepted, transferred, or avoided. OWASP describes recurring activities as system decomposition, threat identification and ranking, mitigation, and review and validation. It also notes that no single process is the industry standard for every use case [C1].

Keep the scope manageable by recording the system version, major data flows, external dependencies, assumed users, and exclusions. Consider confidentiality, integrity, and availability, along with properties relevant to the system such as identity spoofing, repudiation, and privacy impact. A threat is a scenario that could cause harm; a vulnerability is a weakness that could make a scenario possible; and risk combines likelihood, impact, and uncertainty. They should not be collapsed into interchangeable list items.

## 工作机制 | How it works

Start with a system model: components, flows, stores, external services, and trust boundaries. For each cross-boundary flow, record who initiates it, the sensitivity of its data, and how the flow is authenticated and protected. Enumerate assets and abuse goals, then use a framework such as STRIDE to prompt questions about spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege. The categories are prompts, not an automatic threat-discovery engine. Privacy harms, misuse of business workflows, and supply-chain risk may need other methods.

For each concrete scenario, record preconditions, affected assets, attack path, impact, existing controls, risk judgment, owner, and measures still to validate. A severity matrix or attack tree may help order work, but its result depends on assumptions about likelihood and impact; state those assumptions and their evidence. Prefer controls that can be tested, such as “a cross-tenant request cannot read another tenant's object,” and turn them into negative authorization tests, logging rules, or recovery requirements. Microsoft's overview of its threat-modeling tool also treats modeling as analysis and collaboration within a product lifecycle, rather than as diagram production alone [C2].

## 一个例子 | A worked example

Consider a service where users upload invoices and an asynchronous worker extracts fields. A data-flow model includes the browser, upload API, object storage, queue, parser, database, and third-party OCR service. Trust boundaries include client-to-API, API-to-queue, and worker-to-OCR flows. Scenarios might include a forged user reading someone else's invoice, a malicious file exploiting the parser, a duplicate message causing a repeated payment, a flooded queue making the service unavailable, or personal information from an invoice appearing in logs. Possible controls include object-level authorization, file type and size limits, isolated parsing, idempotency keys and rate limits, and minimal log fields. Each control needs a reproducible test and a named owner.

## 局限与误解 | Limits and misconceptions

Model quality depends on whether the architecture is accurate, whether operations and business participants are represented, and whether attacker capabilities are explicit. STRIDE does not cover every kind of risk. A risk matrix helps sort work but does not produce precise probabilities. Treating every tool-generated item as a confirmed vulnerability creates noise; checking every box can create a false sense of completion. Cloud configuration, software versions, and data purposes change, so an old diagram can become invalid. Threat modeling does not replace code review, penetration testing, incident exercises, or compliance assessment. Findings need owners, due dates, and verifiable outcomes.

## 相关标本 | Related specimens

See [Authentication and Authorization](/entries/authentication-authorization) for expressing trust boundaries as per-request policy, [Encryption, Hashing and Signatures](/entries/encryption-hashing-signatures) for choosing data-protection guarantees, and [Data Minimization and Access Control](/entries/data-minimization) for reducing what could be exposed. OWASP and Microsoft Learn provide complementary practice perspectives; choose a method that fits system size, privacy needs, and organizational workflow [S1, S2].
:::
