:::zh
**Paxos**是一类在异步消息系统中让多个节点就单个值达成一致的共识协议。安全性在其崩溃故障模型和协议不变量成立时不依赖消息时限；活性则需要额外的进展条件，例如最终有一个稳定 proposer 能与多数派通信、消息最终送达并获得调度机会。Paxos 的核心安全目标是至多一个值被选定；它不保证在任意网络环境下总能迅速决定结果。[S1][S2]
:::

:::en
**Paxos** is a family of consensus protocols that lets multiple nodes agree on one value in an asynchronous message system. Under its crash-failure model and protocol invariants, safety does not depend on message timing. Liveness needs additional progress conditions, such as an eventually stable proposer that can communicate with a quorum, messages that are eventually delivered, and opportunities for the protocol to run. Its central safety goal is that at most one value is chosen. It does not guarantee that a decision is reached quickly under every network condition. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
基础 Paxos 把参与者分为 proposer、acceptor 与 learner，这些是逻辑角色，同一进程可承担多个角色。一个提案含编号和候选值。proposer 先提出编号，acceptor 以承诺避免接受更低编号的后续提案；若更高编号的提案已经被接受，proposer 必须延续多数派报告的最高编号值，而不能任意换成自己的值。最终，当足够多 acceptor 接受同一提案，它成为 chosen value。协议约束的是选择过程，不包括应用如何解释命令或持久化业务状态。[S1]
:::

:::en
Basic Paxos assigns the logical roles proposer, acceptor, and learner; one process may perform more than one role. A proposal has a number and a candidate value. A proposer first introduces a number, and acceptors promise not to accept lower-numbered proposals. If a higher-numbered proposal has already been accepted, the proposer must carry forward the value associated with the highest accepted number reported by the quorum rather than substitute an arbitrary value. A value is chosen once enough acceptors accept the same proposal. The protocol constrains selection; it does not define how an application interprets a command or persists business state. [S1]
:::

## 工作机制 | How it works

:::zh
两阶段流程先由 proposer 发送 Prepare，请求 acceptor 承诺提案编号并报告已接受的提案；收到多数派承诺后，proposer 选择规则要求的值并发送 Accept。acceptor 若尚未承诺更高编号，则记录并接受；proposer 再等待多数派接受以确认值已选定。提案编号提供全序，持久记录承诺和已接受值可让崩溃重启后的 acceptor 保持安全。多值系统通常在稳定领导者下运行 Multi-Paxos，用一次选主减少后续实例的准备阶段，但实例编号、日志应用和成员变更仍须有明确规则。[S1][S2]
:::

:::en
The two-phase protocol begins when a proposer sends Prepare, asking acceptors to promise a proposal number and report any proposal they have already accepted. After promises from a quorum, the proposer selects the value required by the protocol and sends Accept. An acceptor records and accepts it if it has made no promise to a higher number. The proposer then waits for acceptance by a quorum to establish that the value is chosen. Proposal numbers impose an order, and durable promises and accepted values let a restarted acceptor preserve safety. Multi-value systems commonly use Multi-Paxos under a stable leader to reduce the prepare phase for later instances, but still need explicit rules for instance numbers, log application, and membership changes. [S1][S2]
:::

:::zh
即使某个值已被多数派接受，个别节点也可能尚未获知这一结果；learner 可以通过后续消息学习已选定值。实现通常将一个领导者稳定为 proposer，并让多个日志槽位连续运行协议，避免每条命令都进行完整选举。安全证明依赖提案编号唯一且单调、法定人数交集以及 acceptor 持久化承诺和接受状态；违反其中任一条件都可能破坏证明。
:::

:::en
Even after a value is accepted by a quorum, an individual node may not yet know the result; learners can discover the chosen value through later messages. Implementations often stabilize one proposer as leader and run the protocol across a sequence of log slots, avoiding a full election for every command. The safety argument depends on unique, increasing proposal numbers, quorum intersection, and durable acceptor promises and accepted state. Violating any of these assumptions can invalidate the proof.
:::

:::zh
因此，运维日志应记录协议层的提案编号、槽位、承诺与接受事件，避免只观察客户端最终响应。发生恢复时，节点要先补齐或确认已选定的值，再继续应用新命令。不同 Paxos 家族对领导者、日志修复和成员变更可能采用不同优化；阅读实现文档时要确认它描述的是基础安全规则还是具体产品语义。
:::

:::en
Operational logs should therefore record proposal numbers, slots, promises, and accepts instead of exposing only the final client response. During recovery, nodes must discover or confirm chosen values before applying later commands. Paxos families differ in leader, log-repair, and membership-change optimizations, so implementation documentation should be checked to determine whether it describes the base safety rules or a specific product's behavior.
:::

## 一个例子 | A worked example

:::zh
五个节点要决定一个配置版本，三个 acceptor 构成多数派。提案者 A 以编号 10 收到三份承诺后提出值 `v1`；其中一份回复报告先前已接受编号 8 的 `v0`，A 必须改提 `v0`。如果之后另一提案者以编号 11 继续推进，也必须从它的多数派回复中保留最高编号已接受值。多数派交集保证后续提案能看见先前选定值的证据，从而阻止不同值都成为 chosen。
:::

:::en
Five nodes must choose a configuration version, so three acceptors form a quorum. Proposer A gets promises from three acceptors using proposal number 10 and proposes `v1`. One response reports that it previously accepted `v0` at number 8, so A must switch to `v0`. If another proposer later advances with number 11, it must likewise preserve the highest-numbered accepted value reported by its quorum. Quorum intersection ensures that a later proposal sees evidence of a previously chosen value, preventing two different values from both becoming chosen.
:::

## 局限与误解 | Limits and misconceptions

:::zh
安全性可在延迟和丢包下维持，活性却可能因多个 proposer 竞争、网络分区或持续消息延迟而停滞；随机退避或稳定领导者改善机会，但不等于无条件时限保证。多数派故障会令协议无法继续决定新值。基础单值 Paxos 也不是开箱即用的复制数据库：生产系统需处理磁盘持久化、日志截断、成员变更、快照和应用状态机。Paxos 的数学规则简洁并不代表工程实现简单；调试时应分别验证安全不变量、恢复路径和活性假设。[S1][S2]
:::

:::en
Safety can hold despite delay and packet loss, but liveness can stall under competing proposers, a network partition, or sustained message delay. Randomized backoff or a stable leader improves the chance of progress but is not an unconditional time-bound guarantee. A failed quorum prevents the protocol from deciding new values. Basic single-decree Paxos is not a replicated database ready to deploy: production systems must handle durable storage, log truncation, membership changes, snapshots, and state-machine application. Simple mathematical rules do not make engineering implementation simple; reviews should examine safety invariants, recovery paths, and liveness assumptions separately. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[Raft 共识](/entries/raft-consensus)采用面向日志复制的分解结构；[分布式系统](/entries/distributed-systems)说明共识在复制状态中的用途；[流言协议](/entries/gossip-protocol)负责状态传播，但不提供共识顺序。
:::

:::en
[Raft Consensus](/entries/raft-consensus) uses a decomposition centered on replicated logs. [Distributed Systems](/entries/distributed-systems) explains consensus in replicated state. [Gossip Protocol](/entries/gossip-protocol) disseminates state but does not provide a consensus order.
:::

## 参考资料 | References

:::zh
- [S1] Leslie Lamport，*Paxos Made Simple*（2001）。[论文 PDF](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf)
- [S2] Tushar D. Chandra、Robert Griesemer 与 Joshua Redstone，*Paxos Made Live: An Engineering Perspective*，PODC 2007。[Google Research PDF](https://static.googleusercontent.com/media/research.google.com/en//archive/paxos_made_live.pdf)
:::

:::en
- [S1] Leslie Lamport, “Paxos Made Simple” (2001). [Paper PDF](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf)
- [S2] Tushar D. Chandra, Robert Griesemer, and Joshua Redstone, “Paxos Made Live: An Engineering Perspective,” PODC 2007. [Google Research PDF](https://static.googleusercontent.com/media/research.google.com/en//archive/paxos_made_live.pdf)
:::
