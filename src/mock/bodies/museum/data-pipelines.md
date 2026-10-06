:::zh
**数据管线**是把数据从来源送到目标存储或使用者的一组可运行步骤，通常包括采集、验证、转换、聚合和交付。管线可能批量处理有界数据，也可能持续处理无界事件流；可靠性取决于每一步的输入输出契约、失败恢复和数据质量检查，而不只是把任务串成一个 DAG。[S1][S2]
:::

:::en
A **data pipeline** is a set of executable steps that moves data from a source to a destination or consumer. It commonly includes collection, validation, transformation, aggregation, and delivery. A pipeline may process bounded batch data or an unbounded event stream. Its reliability depends on input/output contracts, failure recovery, and data-quality checks at every step, not just on arranging tasks in a DAG. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
管线的边界从数据源承诺开始，到下游能够安全使用结果为止。契约应写明 schema、单位、时区、主键、排序语义、迟到数据和隐私分类。ETL 先转换再加载，ELT 则先把原始数据载入目标环境后再转换；两者是职责和执行位置的选择，不是可靠性等级。事件流还需区分事件时间与处理时间，并约定重复、迟到和乱序如何处理。调度系统负责触发和依赖，不会自动保证业务数据正确。[S1]
:::

:::en
A pipeline begins with the source's data contract and ends when downstream consumers can safely use the result. The contract should specify schema, units, time zone, keys, ordering semantics, late data, and privacy classification. ETL transforms before loading; ELT first loads raw data into a target environment and transforms there. These are choices about responsibility and execution location, not reliability levels. A stream must also distinguish event time from processing time and define how duplicates, late arrivals, and out-of-order events are handled. A scheduler can trigger work and track dependencies, but it does not guarantee business-data correctness. [S1]
:::

## 工作机制 | How it works

:::zh
每个阶段读取一份输入、执行可审计转换并输出带 schema 的结果。批处理可以按分区或水位标记记录进度，失败后从已完成边界重跑；流处理则用窗口把事件分组，并根据 watermark 判断何时输出结果以及如何接收迟到事件。[S1] 检查点保存状态，重试提高暂时故障后的成功率，但副作用可能重复，因此写入端需要幂等键、事务或去重。[S3] 数据管线还应记录行数、空值率、延迟和血缘，使异常能够定位到具体阶段。[S1][S2]
:::

:::en
Each stage reads an input, applies an auditable transformation, and emits a result with a schema. Batch jobs can track progress by partition or checkpoint and rerun from a completed boundary after failure. Stream processors group events into windows and use watermarks to decide when to emit results and how to handle late arrivals. [S1] Checkpoints preserve state; retries help after transient faults, but side effects may repeat, so sinks need idempotency keys, transactions, or deduplication. [S3] Pipelines should also record row counts, null rates, freshness, and lineage so an anomaly can be traced to a particular stage. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
一条每日销售管线从门店事件流提取订单，验证货币和时间字段，按客户同意状态剔除不应保留的个人信息，再按业务时区聚合日销售额并写入分析库。事件可能重发，因此以订单 ID 去重；前一天迟到的更正会触发对应分区重算。若字段 schema 突然变化，管线将记录坏行并暂停发布，而不是静默生成看似正常的报表。血缘记录帮助分析者找到该指标来自哪个源字段和转换版本。
:::

:::en
A daily sales pipeline reads order events, validates currency and time fields, removes personal data that should not be retained under a customer's consent state, aggregates sales by the business time zone, and writes the result to an analytics store. Events may be resent, so the pipeline deduplicates by order ID. A late correction for the previous day triggers recomputation of the relevant partition. If the schema changes unexpectedly, the pipeline records the bad rows and pauses publication instead of silently producing a plausible report. Lineage lets an analyst trace the metric to its source fields and transformation version.
:::

## 局限与误解 | Limits and misconceptions

:::zh
“恰好一次”通常只在协议和系统边界内成立，端到端写入外部系统仍可能重复或遗漏；必须明确检查点、事务和 sink 的语义。重跑若不是幂等的，会重复收费或计数。水位线是对事件迟到程度的操作性假设，不代表再也不会有更晚事件。DAG 可视化能显示依赖，却不能替代 schema 演进、数据质量和隐私审查。批处理、微批和流式之间也有延迟、成本与复杂度取舍；应按业务新鲜度目标选择，而不是默认越实时越好。[S1][S2]
:::

:::en
“Exactly once” usually applies only within a protocol and system boundary; end-to-end writes to an external system can still be duplicated or lost. Checkpoint, transaction, and sink semantics must be explicit. A non-idempotent rerun can charge or count twice. A watermark is an operational assumption about lateness, not proof that no later event will ever arrive. A DAG can show dependencies but cannot replace schema evolution, data-quality checks, or privacy review. Batch, micro-batch, and streaming also trade latency against cost and complexity. Choose according to freshness requirements rather than assuming that more real-time is always better. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据库](/entries/databases)提供持久化和查询能力；[数据结构](/entries/data-structures)解释分区、索引和去重集合；[信息检索](/entries/information-retrieval)展示下游如何将数据组织成可搜索索引。
:::

:::en
[Databases](/entries/databases) provide persistence and query capabilities. [Data Structures](/entries/data-structures) explains partitions, indexes, and deduplication sets. [Information Retrieval](/entries/information-retrieval) shows how downstream data can be organized into searchable indexes.
:::

## 参考资料 | References

:::zh
- [S1] Apache Beam，*Programming Guide*：窗口、水位线、触发器和状态处理。[官方指南](https://beam.apache.org/documentation/programming-guide/)
- [S2] Apache Beam，*Basics of the Beam model*：有界与无界数据集、转换和管线模型。[概念说明](https://beam.apache.org/documentation/basics/)
- [S3] Apache Beam，*Programming Guide*，external side effects 小节：重试与副作用需要额外考虑。[指南小节](https://beam.apache.org/documentation/programming-guide/#side-effects)
:::

:::en
- [S1] Apache Beam, *Programming Guide*: windows, watermarks, triggers, and state processing. [Official guide](https://beam.apache.org/documentation/programming-guide/)
- [S2] Apache Beam, *Basics of the Beam model*: bounded and unbounded datasets, transforms, and pipeline model. [Concept guide](https://beam.apache.org/documentation/basics/)
- [S3] Apache Beam, *Programming Guide*, “Side Effects”: retries require extra care when external side effects are present. [Guide section](https://beam.apache.org/documentation/programming-guide/#side-effects)
:::
