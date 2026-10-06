:::zh
**分布式系统**由通过网络协作、但各自拥有本地状态与故障边界的计算节点组成。节点可能是进程、虚拟机、服务器或数据中心；关键特征不是“有很多机器”，而是通信会延迟或丢失，节点可能只对一部分参与者不可达，系统因此必须在不完整信息下协调状态。[S1][S2]
:::

:::en
A **distributed system** consists of computing nodes that cooperate over a network while retaining local state and failure boundaries. A node may be a process, virtual machine, server, or data center. The defining challenge is not merely “many machines”: communication can be delayed or lost, and a node may be unreachable to only some participants. The system must coordinate state with incomplete information. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
一台多核计算机也包含并发，但共享内存和时钟使它与跨机器系统有不同假设。网络调用可能比本地函数慢数个数量级，也可能在请求执行后丢失响应；客户端无法仅凭超时判断服务没有执行。复制提高可用性和读取能力，却需要定义写入顺序、冲突处理和恢复过程。系统设计首先要说清故障模型：允许哪些节点崩溃，网络可能怎样分区，数据要保持什么一致性，服务要在什么条件下继续响应。没有一种协议能脱离这些前提被称为“强一致”或“高可用”。[S1]
:::

:::en
A multicore computer also runs concurrent work, but shared memory and clocks give it different assumptions from a cross-machine system. A network call can be orders of magnitude slower than a local function, and a response can be lost after the server has acted; a client cannot infer from a timeout alone that the operation did not execute. Replication can improve availability and read capacity, but requires rules for write order, conflicts, and recovery. Begin by stating the failure model: which nodes may crash, how the network may partition, what consistency the data needs, and when the service must keep responding. No protocol is “strongly consistent” or “highly available” outside those assumptions. [S1]
:::

## 工作机制 | How it works

:::zh
常见构件包括远程过程调用、复制、分片、日志、租约、选主和共识。RPC 提供请求/响应接口，但不能使远程调用拥有本地函数的失败语义；重试需要幂等键、去重或明确的至少一次/至多一次语义。复制可以采用主从或多主方式，副本之间通过日志或状态传播更新。若需让多个节点对操作顺序达成一致，Raft、Paxos 等共识协议会依赖多数派和持久化日志，在安全性与故障恢复前提下选出唯一提交顺序。监控和故障检测只能形成怀疑，不能证明网络另一端永久失效。[S1][S2]
:::

:::en
Common building blocks include remote procedure calls, replication, sharding, logs, leases, leader election, and consensus. An RPC provides a request/response interface but cannot give a remote call the failure semantics of a local function. Retries need idempotency keys, deduplication, or explicit at-least-once/at-most-once semantics. Replication may use a leader or multiple writers, with updates propagated through logs or state exchange. When nodes must agree on operation order, consensus protocols such as Raft or Paxos use a quorum and durable log to choose one committed order under stated safety and recovery assumptions. Monitoring and failure detectors can create suspicion; they cannot prove that a remote machine has failed permanently. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
一个库存服务把商品数量复制到三个节点。客户端把“预留一件”提交给当前领导者；领导者将操作写入日志并复制给副本，达到协议要求的多数派后才确认提交。若客户端没有收到回复，它用同一个幂等请求 ID 重试，避免因响应丢失而重复扣减。[S3] 若领导者崩溃，副本通过选举恢复服务，但尚未提交的日志项不能被当作已生效库存。业务仍需定义售罄、补偿和超时策略，共识本身不会替业务选择语义。
:::

:::en
A stock service replicates inventory to three nodes. A client submits “reserve one item” to the current leader. The leader writes the operation to a log and replicates it; it confirms the reservation only after the protocol's quorum condition is met. If the client never receives the response, it retries with the same idempotency key so a lost reply does not subtract inventory twice. [S3] If the leader crashes, an election can restore service, but an uncommitted log entry must not be treated as a completed reservation. The business still needs rules for sell-out, compensation, and timeouts; consensus does not choose those semantics.
:::

## 局限与误解 | Limits and misconceptions

:::zh
超时不是故障证明，重试也不等于安全。增加副本不自动提高可用性：副本可能同时受同一故障域影响，或者因修复过程错误而扩大数据损坏。更强的一致性通常需要更多协调，跨地域会增加延迟；较弱的一致性则要求应用容忍陈旧读或冲突。CAP 也不是平时只能从三个属性里任选两个的口诀，它强调网络分区发生时一致性与可用性目标的约束。测试应注入延迟、丢包、节点重启和磁盘故障，并检查恢复后数据是否仍满足业务不变量。[S1][S2]
:::

:::en
A timeout is not proof of failure, and a retry is not automatically safe. More replicas do not guarantee higher availability: replicas may share a failure domain, or a faulty repair process may spread corruption. Stronger consistency usually requires more coordination, and cross-region coordination adds latency. Weaker consistency asks applications to tolerate stale reads or conflicts. CAP is not a rule that says a designer always picks any two of three properties; it describes a constraint on consistency and availability goals when a network partition occurs. Tests should inject delay, packet loss, restarts, and disk faults, then check that recovery preserves business invariants. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[Paxos](/entries/paxos)和 [Raft 共识](/entries/raft-consensus)聚焦复制状态机的提交顺序；[流言协议](/entries/gossip-protocol)介绍去中心化成员与状态传播；[TCP 拥塞控制](/entries/tcp-congestion-control)解释底层传输如何反馈网络负载。
:::

:::en
[Paxos](/entries/paxos) and [Raft Consensus](/entries/raft-consensus) focus on commit order for replicated state machines. [Gossip Protocol](/entries/gossip-protocol) covers decentralized membership and state dissemination. [TCP Congestion Control](/entries/tcp-congestion-control) explains how the transport layer responds to network load.
:::

## 参考资料 | References

:::zh
- [S1] Apache Cassandra Documentation，*Dynamo* 架构页：复制、成员管理、故障检测与可调一致性。[在线文档](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)
- [S2] Diego Ongaro 与 John Ousterhout，*In Search of an Understandable Consensus Algorithm*（2014），Raft 论文与复制日志安全性。[论文 PDF](https://raft.github.io/raft.pdf)
- [S3] Malcolm Featonby，*Making retries safe with idempotent APIs*，AWS Builders' Library。[AWS 指南](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
:::

:::en
- [S1] Apache Cassandra Documentation, “Dynamo” architecture: replication, membership, failure detection, and tunable consistency. [Online documentation](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)
- [S2] Diego Ongaro and John Ousterhout, “In Search of an Understandable Consensus Algorithm” (2014), Raft and replicated-log safety. [Paper PDF](https://raft.github.io/raft.pdf)
- [S3] Malcolm Featonby, “Making retries safe with idempotent APIs,” AWS Builders' Library. [AWS guide](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
:::
