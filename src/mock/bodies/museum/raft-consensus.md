:::zh
**Raft 共识**是在一组服务器间复制日志并让状态机按相同顺序执行命令的协议。它通过选举领导者、复制日志和安全规则组织共识过程，目标是让实现与推理更直观。Raft 可容忍少数服务器崩溃；一旦多数派不可达，集群可以保留已提交状态，却不能继续安全提交新日志。[S1][S2]
:::

:::en
**Raft consensus** replicates a log among servers so that state machines apply commands in the same order. It organizes consensus around leader election, log replication, and safety rules, with the aim of making the protocol easier to reason about. Raft tolerates failures of a minority of servers. If a quorum is unreachable, the cluster can preserve committed state but cannot safely commit new log entries. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
服务器在 follower、candidate 和 leader 角色间切换，任期（term）作为逻辑时钟递增。每个任期至多一个领导者；候选者向其他服务器征求选票，只有取得多数派才成为领导者。客户端命令由领导者追加到本地日志，再复制到追随者；某条目被多数派持久保存并满足提交安全条件后，领导者才应用到状态机并回复客户端。网络暂时分区可能出现旧领导者仍自认为活跃，但任期与多数派规则防止它提交新值。[S1]
:::

:::en
Servers move among follower, candidate, and leader roles, with a term acting as a logical clock. Each term has at most one leader. A candidate requests votes and becomes leader only after obtaining a majority. A leader appends client commands to its local log and replicates them to followers. It applies an entry to the state machine and replies to the client only after the entry is durably held by a quorum and satisfies the commit-safety conditions. A temporary partition may leave an old leader believing it is active, but term and quorum rules prevent it from committing new values. [S1]
:::

## 工作机制 | How it works

:::zh
心跳维持追随者的领导者状态；若选举超时到期且没有更新任期的通信，节点自增任期并开始选举。日志匹配规则要求相同索引和任期的条目之前前缀相同，领导者用 `AppendEntries` 校验追随者日志并覆盖冲突的未提交后缀。投票和提交规则保护已提交条目：候选者必须拥有足够新的日志才能当选，避免新领导者丢失提交值。快照可压缩已应用前缀，但安装和恢复过程必须保留状态机一致性。成员变更需要联合配置或受控增删策略，让新旧多数派安全衔接。[S1][S2]
:::

:::en
Heartbeats maintain followers' view of the leader. If an election timeout expires without communication that advances the term, a node increments its term and starts an election. The log-matching rule requires entries before a shared index and term to have an identical prefix. A leader uses `AppendEntries` to validate a follower's log and overwrite conflicting uncommitted suffixes. Voting and commitment rules protect committed entries: a candidate must have an up-to-date log to win, preventing a new leader from losing committed values. Snapshots compact an applied prefix, but installation and recovery must preserve state-machine consistency. Membership changes need joint configuration or controlled add/remove rules so old and new quorums connect safely. [S1][S2]
:::

:::zh
提交规则有一个关键任期条件：领导者不能仅因某条旧任期条目已复制到多数派，就直接把它计为已提交；它按多数派计数提交当前任期的条目。当前任期条目一旦以此方式提交，日志匹配性质才使其前面的旧任期条目一并得到提交保证。[S1]
:::

:::en
The commitment rule has an important term condition: a leader must not treat an entry from an earlier term as committed solely because it appears on a majority of replicas. It advances commitment by counting replicas for an entry from its current term. Once a current-term entry is committed this way, the log-matching property also commits its preceding entries [S1].
:::

## 一个例子 | A worked example

:::zh
五节点配置以三个节点形成多数派。领导者收到“创建订单”命令后写入当前任期的日志条目并复制给另外节点；当三份持久日志包含该条目时，它提交并执行订单状态机，再向客户端确认。若这是一个旧任期条目，即使它出现在三个节点上，领导者也不能只靠副本数直接提交；它要先提交当前任期的条目，旧前缀才随日志匹配规则一并提交。若领导者在只写入两个节点后崩溃，该条目可能尚未提交，新领导者可根据投票规则覆盖冲突后缀。客户端若超时重试，状态机还应使用请求 ID 去重，因为 Raft 保证日志顺序，不自动保证业务命令只被外部观察一次。
:::

:::en
A five-node configuration has a quorum of three. After receiving a “create order” command, the leader writes an entry from its current term and replicates it to other nodes. When three durable logs contain that entry, the leader commits it, applies it to the order state machine, and acknowledges the client. If an entry is from an earlier term, appearing on three nodes is not by itself enough for the leader to commit it by replica count; the leader first commits a current-term entry, after which the log-matching rule commits the preceding entry as well. If the leader crashes after writing to only two nodes, the entry may not be committed; a new leader can overwrite a conflicting suffix under the voting rules. If the client retries after a timeout, the state machine still needs request-ID deduplication: Raft orders the log but does not guarantee that a business command is externally observed exactly once.
:::

## 局限与误解 | Limits and misconceptions

:::zh
Raft 的可理解性目标不是“无须分析就能实现”。时钟和选举超时只影响活性，不提供真实时间保证；磁盘持久化、快照、成员变更、读一致性和客户端重试都需要工程设计。多数派失联时协议停止提交，这是安全性代价；强行让两侧都写会产生分叉状态。领导者故障恢复时间取决于超时、网络和选举竞争。生产系统应检查日志与状态机原子性、崩溃恢复路径以及线性一致性读取所需的确认规则，而不能把“日志复制成功”当作所有读写都一致。[S1][S2]
:::

:::en
Raft's goal of understandability does not make implementation analysis unnecessary. Clocks and election timeouts affect liveness but provide no real-time guarantee. Durable storage, snapshots, membership changes, read consistency, and client retries all need engineering design. When a quorum is unavailable, the protocol stops committing; that is the cost of safety. Allowing both sides to write would risk divergent state. Recovery time after leader failure depends on timeouts, network conditions, and election contention. A production review should examine atomicity between log and state-machine state, crash recovery, and the acknowledgment rules needed for linearizable reads. “Log replication succeeded” does not by itself make every read and write consistent. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[Paxos](/entries/paxos)给出通用的提案与多数派安全性；[分布式系统](/entries/distributed-systems)介绍故障模型和复制目标；[流言协议](/entries/gossip-protocol)传播成员状态但不承担提交日志的共识职责。
:::

:::en
[Paxos](/entries/paxos) presents general proposal and quorum safety. [Distributed Systems](/entries/distributed-systems) introduces failure models and replication goals. [Gossip Protocol](/entries/gossip-protocol) disseminates membership state but does not provide consensus for a committed log.
:::

## 参考资料 | References

:::zh
- [S1] Diego Ongaro 与 John Ousterhout，*In Search of an Understandable Consensus Algorithm*（USENIX ATC 2014）。[论文 PDF](https://raft.github.io/raft.pdf)
- [S2] Raft 项目，*The Raft Consensus Algorithm*：协议概览、教学材料和实现索引。[项目主页](https://raft.github.io/)
:::

:::en
- [S1] Diego Ongaro and John Ousterhout, “In Search of an Understandable Consensus Algorithm,” USENIX ATC 2014. [Paper PDF](https://raft.github.io/raft.pdf)
- [S2] Raft Project, *The Raft Consensus Algorithm*: protocol overview, teaching material, and implementation index. [Project site](https://raft.github.io/)
:::
