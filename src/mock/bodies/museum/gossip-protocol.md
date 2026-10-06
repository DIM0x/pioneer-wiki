:::zh
**流言协议**是一类以反复的局部通信传播成员信息或状态更新的分布式机制。节点不需要向所有其他节点广播；它选择少量伙伴交换摘要或差异，再由这些伙伴继续传播。在网络持续连通、故障未切断所需传播路径且有足够交换轮次时，随机扩散可让消息逐步覆盖群体；成员变化或部分节点失联时的行为则取决于具体协议和故障模型。[S1][S2]
:::

:::en
A **gossip protocol** is a family of distributed mechanisms that spread membership information or state updates through repeated local exchanges. A node does not broadcast to every other node. It selects a small number of peers, exchanges summaries or differences, and lets those peers continue dissemination. With continuing connectivity, enough exchange rounds, and a failure pattern that leaves propagation paths available, randomized spread can gradually cover a population. Behavior under membership changes or partial node loss depends on the concrete protocol and failure model. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
流言有时称为流行病式协议，因为信息沿着接触关系扩散；名称不表示节点会按自然生物机制行动。一次交换可以是 push（发送方主动推送）、pull（接收方拉取）或 push-pull（双向摘要交换）。成员发现、故障怀疑、集群状态传播和反熵修复是不同用途，协议的消息格式、收敛判据和保留时间也不同。流言适合最终传播和容错扩散，不自动提供全局顺序、即时一致或故障证明。[S1][S2]
:::

:::en
Gossip is sometimes called epidemic dissemination because information spreads along contacts; the name does not imply that nodes operate through a biological mechanism. An exchange can be push (the sender initiates), pull (the receiver requests), or push-pull (both exchange summaries). Membership discovery, failure suspicion, cluster-state dissemination, and anti-entropy repair are distinct uses, each with its own message format, convergence test, and retention period. Gossip suits eventual dissemination and fault-tolerant spread; it does not automatically provide global order, immediate consistency, or proof of failure. [S1][S2]
:::

## 工作机制 | How it works

:::zh
节点维护本地成员表或版本摘要，每轮选择一个或多个对等节点交换时间戳、代次或数据摘要。接收者识别较新信息并更新本地状态，之后在后续轮次继续传播。若状态较大，摘要可先识别差异，再只传输缺失片段；反熵过程会周期性比较全量或分区摘要，修复此前丢失的更新。随机选择通常降低协调开销，但收敛速度会受 fanout、节点规模、故障比例、网络分区和轮次频率影响。反复发送已知更新时，还需要过期策略或墓碑避免状态无限增长。[S1][S2]
:::

:::en
Each node keeps a local membership table or version summary. In a round it selects one or more peers and exchanges timestamps, generations, or data summaries. A receiver identifies newer information, updates its local state, and relays it in later rounds. For large state, summaries can identify differences so that only missing fragments are sent; anti-entropy periodically compares full or partitioned summaries to repair updates lost earlier. Random peer choice usually reduces coordination cost, but convergence depends on fanout, population size, failures, network partitions, and round frequency. Repeated propagation also needs expiration rules or tombstones so state does not grow forever. [S1][S2]
:::

:::zh
在 push-pull 轮次中，参与者可以先比较精简的版本摘要，再请求缺失记录。版本向量或分区摘要有助于定位副本间差异，而不必传输整份副本；这降低日常流量，但修复可能要经过多轮，也需保存版本元数据。反熵是前台复制的补充机制：它最终修复差异，却不负责决定某次写入是否已提交。
:::

:::en
In a push-pull round, participants can compare compact version summaries before requesting missing records. Version vectors or per-partition digests can help identify divergence without transmitting an entire replica. This reduces routine traffic, but repair may require multiple rounds and storage for version metadata. Anti-entropy complements foreground replication: it repairs divergence eventually rather than deciding whether a particular write has committed.
:::

## 一个例子 | A worked example

:::zh
一个 Cassandra 集群中新节点加入后，会从对等节点交换成员和拓扑状态。每个节点逐步得知新成员及其状态，再向其他节点传播。若某节点暂时网络不可达，其他节点只能把它标记为疑似失联；网络恢复后，周期性交换和反熵可补回遗漏信息。若某条状态更新必须先于另一条对外生效，则仍要使用明确的版本、冲突解决或共识/事务机制，不能依赖“流言大概已经传遍”。[S2]
:::

:::en
When a new node joins a Cassandra cluster, it exchanges membership and topology state with peers. Each node gradually learns about the member and relays that state to others. If a node is temporarily unreachable, peers can only mark it as suspected; after connectivity returns, periodic exchanges and anti-entropy can repair missing information. If one state update must become externally visible before another, the system still needs explicit versions, conflict resolution, or a consensus/transaction mechanism. It cannot rely on the assumption that gossip has probably reached everyone. [S2]
:::

## 局限与误解 | Limits and misconceptions

:::zh
随机扩散的“最终到达”需要连通性和足够传播机会，不能保证有限时间内每个节点都收敛；网络分区期间，两侧可能维护不同视图。故障检测通常是基于心跳超时的怀疑，慢节点会被误判。流言消息还可能重复、乱序或暂时互相矛盾，因此应用必须定义版本比较与冲突处理。增加 fanout 能加快传播，却提升网络流量；缩短周期也会加重资源占用。把传播机制误认为一致性协议，是最常见的边界错误。[S1][S2]
:::

:::en
Randomized spread reaches everyone eventually only under connectivity and enough propagation opportunities; it does not guarantee convergence within a fixed time. During a partition, separate groups may maintain different views. Failure detection is usually suspicion based on heartbeat timeouts, so a slow node can be misclassified. Gossip messages can be duplicated, reordered, or temporarily contradictory, which means applications must define version comparison and conflict handling. Higher fanout speeds spread but raises network traffic; shorter intervals increase resource use. Mistaking a dissemination mechanism for a consistency protocol is a common boundary error. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[分布式系统](/entries/distributed-systems)提供故障模型和复制背景；[Raft 共识](/entries/raft-consensus)解决需要提交顺序的复制日志；[TCP 拥塞控制](/entries/tcp-congestion-control)解释传播流量与底层网络容量之间的关系。
:::

:::en
[Distributed Systems](/entries/distributed-systems) provides background on failure models and replication. [Raft Consensus](/entries/raft-consensus) orders a replicated log when committed sequencing is required. [TCP Congestion Control](/entries/tcp-congestion-control) explains how dissemination traffic interacts with network capacity.
:::

## 参考资料 | References

:::zh
- [S1] HashiCorp Consul Documentation，Gossip：Serf 的 gossip 协议及成员管理、消息传播用途。[官方文档](https://developer.hashicorp.com/consul/docs/architecture/gossip)
- [S2] Apache Cassandra Documentation，*Dynamo* 架构页：gossip 成员信息传播与故障检测。[官方文档](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)
:::

:::en
- [S1] HashiCorp Consul Documentation, “Gossip”: Serf's gossip protocol and its use for membership and message dissemination. [Official documentation](https://developer.hashicorp.com/consul/docs/architecture/gossip)
- [S2] Apache Cassandra Documentation, “Dynamo” architecture, gossip-based membership dissemination and failure detection. [Official documentation](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)
:::
