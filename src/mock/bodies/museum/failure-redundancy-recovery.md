:::zh
**故障、冗余与恢复**关注系统在组件失效、容量不足或外部依赖不可用时，如何维持可接受的服务并回到正常状态。策展对应物为 *Cyclemys dentata*，只标示分类关联，不涉及该物种的行为。

## 定义与边界 | Definition and boundaries

可靠性不是“永不出错”，而是在明确的环境和负载下，系统以可预期方式提供所需功能的程度。故障是组件或依赖偏离预期，错误是内部状态不正确，失效则是用户可见服务偏离承诺；三者之间可能存在因果链，但不总是一一对应。冗余是增加可替代组件、路径或数据副本，恢复是检测问题、限制影响、切换或重建状态并验证服务恢复的过程。冗余本身不会自动带来可靠性：复制同一个错误配置或共享同一故障域，可能同时失效。[C1]

应先定义用户可感知的目标，例如可用性、正确性、恢复时间和数据丢失上限，再根据这些目标选择架构。单个服务的“正常”不能代表端到端正常，依赖、网络、配额、身份系统和操作流程都可能位于服务边界之外，却仍影响用户。

## 工作机制 | How it works

可靠性设计从故障假设开始：哪些组件会独立损坏，哪些共享电源、区域、凭据、部署或控制面？接下来用隔离和限流控制故障传播，以健康检查、超时、有限重试、熔断或负载削减避免排队与级联失败。数据系统还需定义副本一致性、备份频率、恢复顺序和校验方式。自动切换必须确认备用路径可承载实际负载，且切换时不会造成双主写入或数据分叉。

恢复流程应包含检测、判断、缓解、修复、验证和复盘。目标恢复时间（RTO）描述恢复服务允许花费的时长；恢复点目标（RPO）描述可接受的数据回退范围。它们是业务与技术共同确认的目标，不是架构一经部署就自动满足的属性。定期演练备份恢复、区域故障和依赖超时，能暴露文档缺漏与权限问题；演练结论要反映到容量、程序和告警中。[C2]

## 一个例子 | A worked example

某订票应用的主数据库位于一个区域，异步备份存放于另一故障域。目标是区域中断后两小时内恢复，最多丢失十五分钟已确认订单。架构可结合跨区备用数据库、定期备份和异步日志复制，但是否达到目标必须实测：模拟主区不可用，执行决策与提升流程，记录实际恢复时间，再核对恢复点中订单的时间戳和完整性。若复制延迟已超过十五分钟，系统应告警或降低对外承诺，而不能把“有副本”当作数据安全的证据。恢复后还要检查重复预订、待处理支付与通知队列是否需要协调。

## 局限与误解 | Limits and misconceptions

重试可能放大过载；必须限定次数、加入退避和抖动，并区分可重试错误与不可重试操作。自动故障转移也会受共同依赖、陈旧数据、DNS 缓存或控制面故障影响。备份如果从未恢复验证，不能视为可恢复备份。跨区域复制保护部分故障，却不能保证应用逻辑正确、抵御凭据滥用或免受逻辑删除传播。演练只能覆盖设计的情景，不能穷尽未知故障；可靠性工作需要持续基于事故、容量变化和业务目标更新假设。

## 相关标本 | Related specimens

参见[分布式系统](/entries/distributed-systems)理解网络与一致性，[日志、指标与追踪](/entries/logs-metrics-traces)构建故障信号，并用[威胁建模](/entries/threat-modeling)检查恶意活动与意外故障共享的依赖面。Google SRE 对监控与过载的经验、AWS Well-Architected Reliability 指南提供实践框架，但架构应按本地故障模型和服务目标验证 [S1, S2]。
:::

:::en
**Failure, Redundancy and Recovery** asks how a system can preserve acceptable service and return to normal when a component fails, capacity is exhausted, or an external dependency becomes unavailable. Its editorial taxonomic counterpart is *Cyclemys dentata*, included only as a catalogue association and without claims about the species' behaviour.

## 定义与边界 | Definition and boundaries

Reliability does not mean “nothing ever goes wrong.” It describes how consistently a system provides required functions under stated conditions and load. A fault is a component or dependency behaving outside expectation; an error is an incorrect internal state; a failure is an externally observable departure from the service promise. They may form a causal chain, but the terms are not interchangeable. Redundancy adds substitutable components, paths, or copies of data. Recovery detects a problem, limits its effects, switches or rebuilds state, and verifies that service has returned. Redundancy alone does not create reliability: duplicate instances that share a faulty configuration or failure domain may fail together [C1].

Begin with user-visible objectives such as availability, correctness, recovery time, and acceptable data loss. Then choose an architecture to meet them. One healthy service does not imply a healthy end-to-end workflow. Dependencies, networks, quotas, identity systems, and operational procedures may sit outside a service's boundary while still affecting users.

## 工作机制 | How it works

Reliability engineering starts with failure assumptions. Which components can fail independently, and which share a power source, region, credentials, deployment, or control plane? Isolation and admission control can limit propagation; health checks, timeouts, bounded retries, circuit breakers, and load shedding can prevent queues and cascading failures. Data systems also need explicit replication consistency, backup frequency, restoration order, and validation. An automatic failover must establish that the standby path can handle real load and that switching will not create two active writers or divergent data.

A recovery process should cover detection, assessment, mitigation, repair, verification, and learning. Recovery time objective (RTO) states how long service recovery may take. Recovery point objective (RPO) states how much data rollback is acceptable. These are business and engineering targets, not properties that a deployed architecture automatically satisfies. Rehearsing a backup restore, regional outage, or dependency timeout can reveal missing documentation and access rights. Findings should change capacity, procedures, and alerts rather than remain as exercise notes [C2].

## 一个例子 | A worked example

Suppose a booking application has a primary database in one region and asynchronous backups in another failure domain. The objective is to restore service within two hours of a regional outage while losing no more than fifteen minutes of confirmed orders. A standby database, periodic backups, and replicated logs may help, but achievement requires a measured exercise. Make the primary region unavailable, perform the decision and promotion procedure, record the elapsed recovery time, then inspect timestamps and integrity of the restored orders. If replication lag exceeds fifteen minutes, the team needs an alert or a changed service commitment; “we have a replica” is not evidence that the data objective is met. After recovery, reconcile duplicate bookings, pending payments, and notification queues.

## 局限与误解 | Limits and misconceptions

Retries can amplify overload. Bound their count, add backoff and jitter, and distinguish retryable failures from operations that must not be repeated. Automatic failover can also be affected by shared dependencies, stale data, DNS caching, or a broken control plane. A backup that has never been restored is not a demonstrated recovery path. Cross-region replication protects against some failures, but it does not guarantee correct application logic, prevent credential misuse, or stop a logical deletion from propagating. Exercises cover the scenarios they were designed to test, not every unknown failure. Assumptions must be revisited as incidents, capacity, and business objectives change.

## 相关标本 | Related specimens

See [Distributed Systems](/entries/distributed-systems) for network and consistency constraints, [Logs, Metrics and Traces](/entries/logs-metrics-traces) for signals used to detect failure, and [Threat Modeling](/entries/threat-modeling) for dependencies shared by malicious activity and accidental outages. Google SRE's monitoring and overload chapters and the AWS Well-Architected Reliability guidance provide practice frameworks; an architecture still needs validation against its own failure model and service objectives [S1, S2].
:::
