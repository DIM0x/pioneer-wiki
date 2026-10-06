:::zh
**日志、指标与追踪**是理解运行中系统的三种互补观测信号。策展对应物为 *Heosemys grandis*，仅保留分类关系；本文不据此推断任何动物行为。

## 定义与边界 | Definition and boundaries

日志记录某个时间点发生的事件及其上下文；指标把测量值按时间聚合，适合回答“影响规模如何变化”；追踪表示一次请求经过组件的路径，并把跨服务操作关联起来。OpenTelemetry 将 traces、metrics 和 logs 作为不同信号类别：路径、运行时测量和事件记录可以从不同角度描述同一系统活动。[C1] 它们不是同义词，也不能互相完全替代。单条日志能解释一个错误上下文，却未必揭示总体发生率；聚合指标能显示错误升高，却可能缺少某次请求经过的具体依赖；追踪能串起调用链，但采样后不一定保留每个事件。

可观测性是从可用输出推断系统内部状态的能力，不等于安装一个仪表盘产品。有效观测还需要有意义的命名、时间同步、服务和版本标识、覆盖关键路径的埋点，以及能够将信号与用户体验联系起来的服务目标。遥测本身也有成本和隐私影响，需限制高基数标签、敏感值和不必要的保留。

## 工作机制 | How it works

先从一个用户问题出发，例如“付款变慢了吗，慢在本服务还是上游？”为请求创建追踪上下文，记录跨进程传播的 trace 和 span 标识；对事件写入结构化字段与时间戳；把请求量、延迟分布、错误率、队列深度或资源饱和度汇总成指标。统一语义约定有助于跨组件查询，但标签要谨慎设计：用户 ID、完整 URL 或任意查询词会造成高基数和隐私风险。直方图可保留延迟分布信息，平均值则可能掩盖尾部慢请求。

采样减少追踪的存储与传输成本，却会漏掉未采样事件；对于低频高严重度问题，需要错误触发采样、专门事件或其他补充路径。日志记录应避免令牌、密码和直接标识符，必要时脱敏或限制访问。监控告警要基于用户可见的症状和行动价值，而不只是在每个内部变量变化时通知。Google SRE 的实践强调区分需要立即叫醒值班人员的问题与适合异步处理的信号。[C2]

## 一个例子 | A worked example

用户提交一笔支付，入口服务建立 trace，调用库存、支付网关和订单库。若总体支付延迟上升，延迟直方图先显示尾部而非平均值恶化；追踪样本进一步显示支付网关 span 占去大部分时间；关联日志说明请求因上游限流而重试。团队便可区分局部代码变慢、依赖变慢与重试放大。排查后，可用服务级指标确认影响恢复，并以 trace 采样和日志中的脱敏请求 ID 复核个别案例。若搜索日志需要直接查出客户身份，就应通过受控映射完成，而非把身份长期写入所有信号。

## 局限与误解 | Limits and misconceptions

更多数据不必然带来更清楚的原因。埋点缺失、时钟偏差、错误的服务命名和采样偏差会产生误导；仪表板相关性不能单独证明因果。追踪只呈现被仪器化且被采样的路径，不代表完整系统；指标聚合可能隐藏少数租户或地区的恶化。高基数标签还会抬高成本、拖慢查询。日志可能含有个人信息或认证秘密，因此采集前就应设计字段和保留策略，泄露后再过滤并不可靠。指标和告警也可能引发告警疲劳，需定期检验行动价值。

## 相关标本 | Related specimens

参见[故障、冗余与恢复](/entries/failure-redundancy-recovery)把信号接入恢复流程，[数据最小化与访问控制](/entries/data-minimization)减少遥测数据暴露，并用[威胁建模](/entries/threat-modeling)识别监控平台及其凭据的风险。OpenTelemetry 对信号的定义和 Google SRE 的监控章节提供互补基础；具体仪表盘应由服务目标和实际排障问题决定 [S1, S2]。
:::

:::en
**Logs, Metrics and Traces** are three complementary signals for understanding a running system. Its editorial taxonomic counterpart is *Heosemys grandis*, retained only as a catalogue relationship; no claim about animal behaviour is made here.

## 定义与边界 | Definition and boundaries

A log records an event and its context. A metric aggregates measurements over time and helps answer how the size or rate of an effect changes. A trace describes the path of a request through components and can connect operations across services. OpenTelemetry describes traces, metrics, and logs as separate signal categories: a request path, a runtime measurement, and an event record can each show a different angle on the same activity [C1]. They are not synonyms and cannot fully replace one another. A single log entry may explain one error but not its overall rate. An aggregate metric may reveal a rise in errors without showing which dependencies a request visited. A trace can connect calls, but sampling may mean that it does not retain every event.

Observability is the ability to infer internal system state from outputs the system makes available; it is not the installation of a dashboard product. Useful observation also requires meaningful naming, synchronized timestamps, service and version identity, instrumentation of important paths, and service objectives that connect signals to user experience. Telemetry has cost and privacy consequences as well, so high-cardinality labels, sensitive values, and unnecessary retention need limits.

## 工作机制 | How it works

Start with a question users or operators need to answer, such as “Has checkout slowed, and is the delay in our service or upstream?” Create trace context for a request and propagate trace and span identifiers across processes. Write events with structured fields and timestamps. Aggregate request volume, latency distributions, error rates, queue depth, or resource saturation into metrics. Consistent semantic conventions help queries span components, but label design needs care: user IDs, full URLs, or arbitrary search terms create both high cardinality and privacy risks. Histograms preserve distribution information that an average may hide, especially for tail latency.

Sampling reduces trace storage and transport but omits unsampled events. Low-frequency, high-severity problems may need error-triggered sampling, dedicated events, or another collection path. Logs should avoid tokens, passwords, and direct identifiers; sensitive fields should be excluded, redacted, or access-controlled. Alerts should represent a user-visible symptom and justify an action, rather than page an operator for every internal variable change. Google SRE distinguishes conditions that require immediate human attention from signals that can be handled asynchronously [C2].

## 一个例子 | A worked example

A user submits a payment. The entry service creates a trace and calls inventory, a payment gateway, and an order database. When overall payment latency rises, a latency histogram shows that the tail has worsened even though the average changed little. Sampled traces then show that the gateway span accounts for most of the delay. Correlated logs report retries after upstream rate limiting. The team can distinguish slow local code from a slow dependency and from retry amplification. After mitigation, service-level metrics confirm whether users recovered; sampled traces and a redacted request identifier help verify individual cases. If an investigation needs to identify a customer, use a controlled mapping process instead of writing identity into every signal indefinitely.

## 局限与误解 | Limits and misconceptions

More data does not necessarily produce a clearer cause. Missing instrumentation, clock skew, mistaken service names, and biased sampling can mislead an investigation. Dashboard correlation alone does not prove causation. Traces show only instrumented and sampled paths, not the complete system; metric aggregation may hide deterioration for one tenant or region. High-cardinality labels can raise storage costs and slow queries. Logs may contain personal information or authentication secrets, so fields and retention should be designed before collection; filtering after exposure is unreliable. Metrics and alerts can also create alert fatigue, so teams should periodically ask whether each alert leads to a useful action.

## 相关标本 | Related specimens

See [Failure, Redundancy and Recovery](/entries/failure-redundancy-recovery) for connecting signals to recovery procedures, [Data Minimization and Access Control](/entries/data-minimization) for reducing telemetry exposure, and [Threat Modeling](/entries/threat-modeling) for risks to monitoring systems and their credentials. OpenTelemetry's signal definitions and Google SRE's monitoring chapter provide complementary foundations; service objectives and real investigation needs should determine the resulting dashboards [S1, S2].
:::
