:::zh
**身份认证与授权：守住应用边界**讨论两个连续但不能混为一谈的问题：请求来自谁，以及这个主体能否对特定资源执行特定操作。策展对应物为 *Mauremys reevesii*；这只是 taxonomy-map 中的分类关联，不表示该物种具有任何与软件安全相关的行为。

## 定义与边界 | Definition and boundaries

身份认证（authentication）验证主体对身份声明的证明，例如密码、通行密钥或受信身份提供方返回的断言。授权（authorization）则依据主体、资源、动作和上下文作出准入决定。成功登录只建立一个可被系统识别的主体；它不会自动授予读取所有记录、修改他人资料或调用管理接口的权利。反过来，公开图片或登录页也可能允许匿名访问。因此，身份验证、身份核验、会话管理与访问控制分别回答不同问题，边界应在威胁模型和接口设计中写清楚。[C1]

## 工作机制 | How it works

认证链路通常从凭据验证开始，随后建立受保护的会话或令牌，之后请求携带会话证明。实现时需保护凭据传输与存储，限制暴力尝试，并为恢复账户、更新安全信息和注销会话定义流程。联邦登录也不能只“相信收到的令牌”：依协议验证签发者、受众、签名和有效期，并把外部身份与本地账户绑定到稳定且唯一的标识。

授权可抽象为决策函数：`allow(subject, action, resource, context)`。角色模型把权限分配给岗位角色，属性模型还可以检查租户、资源所有者、时间或工作状态。常用的安全基线是默认拒绝、最小权限，并在每次请求的服务端重新检查；只保护页面按钮、隐藏链接或在登录时检查一次，都不能阻止用户直接构造另一个 API 请求。[C2]

## 一个例子 | A worked example

设想一个多租户文档服务：Alice 已通过认证，拥有 `tenant=red` 的成员身份。她请求 `GET /documents/842`。认证层从受保护会话解析 Alice；授权层再读取文档 842 的租户与允许动作。若文档属于 red 且 Alice 有读取权限才返回内容；属于 blue、资源不存在、或策略无法判断时，均不得把记录正文送出。可把该边界写为测试矩阵：同租户成员可读、跨租户成员不可读、未登录主体不可读、管理员仅能执行明确列出的动作。测试应直接调用 API，并覆盖列表、导出、批量和后台任务等旁路。

## 局限与误解 | Limits and misconceptions

认证强度依赖凭据、恢复流程、终端和会话管理的整体组合；多因素认证能抵御许多仅靠密码的攻击，但不能替代授权，也无法自动阻止已登录用户滥用过宽权限。统一错误消息可减少账户枚举，却要兼顾恢复体验与响应时间差异。锁定账号可能变成拒绝服务手段。策略集中管理有助于一致性，但若缓存陈旧、身份属性未经验证或资源归属判断有误，集中策略一样会放行错误请求。权限表还会随组织变化而漂移，必须复查并测试。

## 相关标本 | Related specimens

可继续阅读[威胁建模](/entries/threat-modeling)来列出主体、资产和边界，也可对照[数据最小化与访问控制](/entries/data-minimization)讨论获准访问后仍应少处理哪些数据，以及[加密、哈希与签名](/entries/encryption-hashing-signatures)区分传输或存储保护和身份决策。依据 [S1] 与 [S2] 的指南，具体策略仍须结合本系统的数据敏感度和业务规则验证。
:::

:::en
**Authentication and Authorization: Protecting Application Boundaries** separates two related questions: who made a request, and whether that subject may perform a particular action on a particular resource. Its editorial taxonomic counterpart is *Mauremys reevesii*. That association is a catalogue relationship only; it makes no claim about the animal's behaviour or about biology explaining software security.

## 定义与边界 | Definition and boundaries

Authentication verifies evidence for a subject's identity claim, such as a password, a passkey, or an assertion from a trusted identity provider. Authorization evaluates whether that subject may perform an action on a resource under specified conditions. A successful login gives the system a principal it can recognize; it does not grant that principal access to every record, another user's profile, or an administrative endpoint. Conversely, an image or login page may be intentionally public. Identity proofing, authentication, session management, and access control therefore answer different questions and should be distinguished in both the design and the threat model. OWASP's authorization guidance explicitly separates authenticated users from authorized ones and notes that an authenticated user can still exploit horizontal access-control flaws [C1].

## 工作机制 | How it works

An authentication flow validates a credential, then establishes a protected session or token that later requests can present. The design also needs rules for credential storage and transport, throttling, account recovery, security-sensitive changes, session renewal, and logout. Federated login adds another boundary: a relying party must validate the assertion according to its protocol, including issuer, audience, signature, and expiry, and bind the external identity to a stable local identifier. Accepting a profile name or an email address as proof of account ownership can create an unsafe account-linking path.

Authorization can be described as a decision function: `allow(subject, action, resource, context)`. Role-based access control associates permissions with roles; attribute-based decisions can also consider a tenant, resource ownership, time, device, or other policy inputs. OWASP recommends least privilege, deny by default, and permission checks on every request [C2]. Those rules mean that a browser's hidden button is only a presentation choice. The server must check the actual API operation, including requests sent directly by a client, background jobs, exports, bulk actions, and alternate routes.

## 一个例子 | A worked example

Consider a multi-tenant document service. Alice has authenticated and belongs to tenant `red`. She requests `GET /documents/842`. The authentication layer resolves Alice's principal from a protected session. The authorization layer then obtains the document's tenant and the requested operation. It returns the document only if the document belongs to `red` and Alice has read permission. If the document belongs to tenant `blue`, if Alice is unauthenticated, or if the policy cannot establish the required facts, the response must not disclose the document body.

Turn that rule into direct API tests: a red tenant member can read an allowed document; a blue tenant member cannot; an anonymous request cannot; and an administrator can perform only the explicitly granted operations. Test the collection endpoint, export route, bulk endpoint, and worker path as well as the ordinary detail page. A test that only checks whether the interface hides a link does not exercise the security boundary.

## 局限与误解 | Limits and misconceptions

Authentication strength depends on the entire system, including credentials, recovery procedures, endpoints, and session lifecycle. Multi-factor authentication blocks many password-only attacks, but it does not fix overbroad authorization or abuse by an already authenticated account. Generic error messages can reduce account enumeration, yet they must be balanced with usable recovery and differences in response timing. Account lockout can itself become a denial-of-service mechanism. A centralized policy engine improves consistency only if its inputs are trustworthy and its caches are fresh; a wrong ownership lookup remains a wrong decision even when the policy code is shared. Permission assignments also drift as people and responsibilities change, so review and regression tests remain necessary.

## 相关标本 | Related specimens

Read [Threat Modeling](/entries/threat-modeling) to identify principals, assets, and trust boundaries. Compare [Data Minimization and Access Control](/entries/data-minimization) to ask what data an authorized operation actually needs, and [Encryption, Hashing and Signatures](/entries/encryption-hashing-signatures) to separate confidentiality and integrity mechanisms from access decisions. OWASP's recommendations are guidance to adapt to a system's data sensitivity and business rules, not a complete policy for every application [S1, S2].
:::
