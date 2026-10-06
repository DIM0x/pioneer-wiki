:::zh
**数据库**是用于持久化组织数据、执行查询和维护约束的软件系统。数据库管理系统负责数据页、索引、并发访问、日志、恢复与权限；应用通过查询语言或接口表达所需结果。关系数据库以表、键和约束表达结构，其他数据库则可能围绕文档、键值、列族或图模型组织数据。选型取决于访问模式、事务要求、数据关系和运维条件，不由“现代”标签决定。[S1][S2]
:::

:::en
A **database** is a software system for persistently organizing data, executing queries, and maintaining constraints. A database management system handles pages, indexes, concurrent access, logging, recovery, and permissions; applications express the desired result through a query language or API. Relational databases describe structure with tables, keys, and constraints, while other systems may organize data around documents, key-value pairs, column families, or graphs. Selection depends on access patterns, transaction requirements, relationships, and operating conditions, not on a “modern” label. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
数据库与数据库管理系统相关但不相同：前者指持久化的数据集合，后者是管理它的软件。查询优化器会依据统计信息选择扫描、连接和索引路径；存储引擎把逻辑记录映射到页面和日志。事务把多步操作组织成具有规定语义的单元；ACID 是常见目标框架，但各系统的隔离级别和耐久性细节并不完全相同。SQL 语句成功返回也不自动说明数据已经写入稳定介质，具体取决于提交策略、复制确认和存储配置。[S1][S2]
:::

:::en
A database and a database management system are related but distinct: the first is the persistent data collection, and the second is the software that manages it. A query optimizer uses statistics to choose scans, joins, and index paths; the storage engine maps logical records to pages and logs. A transaction groups multiple operations into a unit with defined semantics. ACID is a common framework, but isolation levels and durability details differ across systems. A successful SQL response does not by itself prove that data reached stable media; that depends on commit policy, replication acknowledgment, and storage configuration. [S1][S2]
:::

## 工作机制 | How it works

:::zh
以一次转账为例，数据库在事务中读取两边余额、检查不变量、更新记录并提交。并发控制通过锁、版本或多版本并发控制避免不一致交错；MVCC 可让读取者看到一致快照，而写冲突仍需检测。[S1] 事务日志记录足够的信息，以便崩溃后重做已提交修改、撤销未完成修改。[S4] 索引是额外的数据结构，用空间和写入维护成本换取更快检索；查询优化器不一定选索引，因为全表扫描对小表或低选择性条件可能更便宜。[S3]
:::

:::en
Consider a bank transfer. Within one transaction, the database reads both balances, checks invariants, updates the records, and commits. Concurrency control uses locks, versions, or multiversion concurrency control to avoid invalid interleavings. MVCC can let readers observe a consistent snapshot, while write conflicts still need detection. [S1] A transaction log records enough information to redo committed changes and undo incomplete work after a crash. [S4] An index is an auxiliary structure that trades storage and write-maintenance cost for faster lookup. The optimizer may skip an index because a table scan can be cheaper for a small table or a low-selectivity condition. [S3]
:::

## 一个例子 | A worked example

:::zh
在线商店把订单写入 `orders` 表，并为客户 ID 和创建时间建立索引。结账事务先锁定或以版本条件检查库存，插入订单和明细，扣减库存后提交。若系统在提交途中崩溃，恢复流程根据日志判断事务是否完成；若客户端只因网络超时而没有收到成功回复，它仍需通过订单号查询结果，不能盲目再次扣库存。索引让订单历史查询更快，但每次写入也要更新索引结构，因此索引数量需要按真实查询负载设计。
:::

:::en
An online store writes orders to an `orders` table and indexes customer ID and creation time. During checkout, a transaction locks inventory or checks a version, inserts the order and its lines, decrements stock, and commits. If the system crashes during commit, recovery uses the log to determine whether the transaction completed. If the client merely times out before receiving the success response, it should query by order ID rather than blindly decrement inventory again. Indexes speed order-history queries, but every write must maintain them, so their number should reflect the actual query workload.
:::

## 局限与误解 | Limits and misconceptions

:::zh
ACID 不意味着数据库会替应用选择正确业务规则；重复请求、跨服务事务和外部支付仍需幂等与补偿设计。索引越多不一定越好，写放大、空间占用和维护会增加。强事务也不等于无限扩展：跨分片协调会增加延迟和故障复杂度。数据库备份若未验证恢复，不能证明可恢复；复制通常也会复制误删或损坏。选择前应写清数据模型、查询样例、一致性边界、恢复目标、访问控制和迁移方式，并以目标版本文档核对行为。[S1][S2]
:::

:::en
ACID does not choose the right business rules for an application. Duplicate requests, cross-service transactions, and external payments still need idempotency and compensation. More indexes are not always better: they add write amplification, storage, and maintenance. Strong transactions do not imply unlimited scaling; cross-shard coordination adds latency and failure complexity. An untested backup does not prove recoverability, and replication can copy accidental deletion or corruption. Before choosing a system, state the data model, representative queries, consistency boundary, recovery objectives, access controls, and migration path, then verify behavior against documentation for the target version. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据结构](/entries/data-structures)介绍索引背后的组织方式；[B 树](/entries/b-tree)解释常见有序索引；[数据管线](/entries/data-pipelines)说明数据库如何进入采集和交付流程。
:::

:::en
[Data Structures](/entries/data-structures) introduces the organizations used by indexes. [B-tree](/entries/b-tree) explains a common ordered index. [Data Pipelines](/entries/data-pipelines) covers how databases participate in collection and delivery workflows.
:::

## 参考资料 | References

:::zh
- [S1] PostgreSQL 18 文档，*Introduction to MVCC*。[官方文档](https://www.postgresql.org/docs/current/mvcc-intro.html)
- [S2] PostgreSQL 18 文档，*Transactions*。[事务教程](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [S3] PostgreSQL 18 文档，*Indexes*：索引提升查找速度，同时增加维护开销。[官方文档](https://www.postgresql.org/docs/current/indexes.html)
- [S4] PostgreSQL 18 文档，*Reliability and the Write-Ahead Log*。[官方文档](https://www.postgresql.org/docs/current/wal.html)
:::

:::en
- [S1] PostgreSQL 18 Documentation, “Introduction to MVCC.” [Official documentation](https://www.postgresql.org/docs/current/mvcc-intro.html)
- [S2] PostgreSQL 18 Documentation, “Transactions.” [Transaction tutorial](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [S3] PostgreSQL 18 Documentation, “Indexes”: indexes speed lookups while adding maintenance overhead. [Official documentation](https://www.postgresql.org/docs/current/indexes.html)
- [S4] PostgreSQL 18 Documentation, “Reliability and the Write-Ahead Log.” [Official documentation](https://www.postgresql.org/docs/current/wal.html)
:::
