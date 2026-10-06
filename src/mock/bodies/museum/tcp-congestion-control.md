:::zh
**TCP 拥塞控制**是发送端根据网络反馈调节在途数据量的机制，目标是在共享链路上提高有效吞吐，同时避免发送速率长期超过路径可承载能力。它与接收端流量控制相关但不同：接收窗口保护接收方缓冲区，拥塞窗口估计网络可承受的未确认数据量；实际发送量受二者较小值约束。[S1]
:::

:::en
**TCP congestion control** lets a sender adjust the amount of in-flight data in response to network feedback. Its goal is to use a shared path efficiently without sending faster than the path can sustain. It is related to, but distinct from, receiver flow control: the receive window protects the receiver's buffer, while the congestion window estimates how much unacknowledged data the network can carry. The usable sending window is bounded by the smaller of the two. [S1]
:::

## 定义与边界 | Definition and boundaries

:::zh
拥塞不是某台机器“处理不过来”的同义词，而是路径上的链路、路由器队列或接收端共同形成的负载问题。TCP 发送端看不到全网状态，只观察确认、重复确认、丢包和往返时间等信号，再据此推断。基础 TCP 规范描述慢启动、拥塞避免、快速重传和快速恢复等行为；现代系统还可部署不同拥塞控制算法。算法改变的是如何估计和探测可用容量，不能消除物理瓶颈，也不能替代应用层限流。[S1][S2]
:::

:::en
Congestion is not simply one overloaded computer; it is a load condition shaped by links, router queues, and receiver behavior along a path. A TCP sender cannot see the whole network. It infers conditions from signals such as acknowledgments, duplicate acknowledgments, loss, and round-trip time. The base TCP specification describes slow start, congestion avoidance, fast retransmit, and fast recovery. Modern systems can use different congestion-control algorithms. An algorithm changes how a sender estimates and probes available capacity; it cannot remove a physical bottleneck or replace application-level rate limiting. [S1][S2]
:::

## 工作机制 | How it works

:::zh
连接建立后，发送端以较小拥塞窗口开始传输。慢启动阶段通常按确认反馈快速增加窗口，直到遇到阈值或拥塞信号；之后拥塞避免以较缓的方式探测额外带宽。检测到丢包时，传统算法会缩小窗口并重传数据，因为丢包可能表示队列溢出。累计确认使发送端知道哪些字节已到达；计时器处理长时间没有确认的情况，重复确认可更早触发重传。Reno 等算法以窗口增长与减小规则作为探测器；CUBIC 则用与时间相关的立方函数增长窗口，在高带宽、长 RTT 路径上改善探测效率。[S1][S2]
:::

:::en
After a connection begins, the sender transmits with a small congestion window. During slow start it usually grows the window rapidly as acknowledgments arrive, until it reaches a threshold or sees a congestion signal. Congestion avoidance then probes for more bandwidth more gradually. Traditional algorithms treat packet loss as a possible sign of queue overflow and reduce the window before retransmitting. Cumulative acknowledgments tell the sender which bytes arrived; a timer handles a prolonged lack of acknowledgment, while duplicate acknowledgments can trigger an earlier retransmission. Reno-like algorithms use increase and decrease rules as a probe. CUBIC uses a time-based cubic growth function to probe more effectively on high-bandwidth, long-RTT paths. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
假设一条瓶颈链路最初空闲，多个 TCP 流陆续开始发送。各发送端逐步扩大窗口，链路队列增长；出现丢包或其他拥塞信号后，它们降低发送窗口，让队列有机会排空。随后发送端再逐步探测容量。若其中一个流采用更激进算法，它可能短期抢到更多带宽，因此测试时要观察多流公平性、队列时延和总吞吐，而不只是单连接峰值。这个机制依赖反馈往返时间，所以远距离路径反应较慢。
:::

:::en
Suppose a bottleneck link is initially idle and several TCP flows begin sending. Each sender gradually expands its window and the link queue grows. After a loss or another congestion signal, the senders reduce their windows, giving the queue a chance to drain. They then probe for capacity again. If one flow uses a more aggressive algorithm, it may temporarily claim more bandwidth. Evaluation should therefore measure fairness across flows, queueing delay, and aggregate throughput, not just the peak rate of one connection. The mechanism depends on a feedback round trip, so a distant path responds more slowly.
:::

## 局限与误解 | Limits and misconceptions

:::zh
把丢包一律当作拥塞会误判无线链路或随机错误；而只看吞吐又会忽略缓冲膨胀造成的高延迟。不同算法可能有不同的公平性、收敛速度和队列占用，不能因名称更新就推定更优。加密和隧道也可能隐藏部分反馈。ECN 可在队列溢出前标记拥塞，但需要路径和端点共同支持。拥塞控制调节单条连接的网络行为；它不保证应用公平、不会处理服务过载，也不承诺恒定带宽。运维还应关注队列管理、接收窗口、并发连接数和应用需求。[S1][S2]
:::

:::en
Treating every loss as congestion can misread wireless errors, while looking only at throughput misses the high latency caused by bufferbloat. Algorithms differ in fairness, convergence, and queue occupancy; a newer name does not guarantee a better result. Encryption and tunnels can also hide some feedback. ECN can mark congestion before a queue overflows, but the path and endpoints must support it. Congestion control regulates a connection's network behavior. It does not guarantee fairness among applications, solve server overload, or promise a constant bandwidth. Operations also need to consider queue management, receive windows, concurrent connections, and the application's actual demand. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[操作系统内核](/entries/os-kernel)介绍主机网络栈所在的系统边界；[存储层次](/entries/memory-hierarchy)说明缓存与队列如何改变延迟；[分布式系统](/entries/distributed-systems)讨论超时和网络分区对跨机器协调的影响。
:::

:::en
[Operating System Kernel](/entries/os-kernel) introduces the system boundary that contains a host's network stack. [Memory Hierarchy](/entries/memory-hierarchy) explains how caches and queues affect latency. [Distributed Systems](/entries/distributed-systems) covers the effect of timeouts and network partitions on coordination across machines.
:::

## 参考资料 | References

:::zh
- [S1] M. Allman、V. Paxson、E. Blanton，RFC 5681，*TCP Congestion Control*（2009）。[RFC Editor](https://datatracker.ietf.org/doc/rfc5681/)
- [S2] I. Rhee 等，RFC 9438，*CUBIC for Fast and Long-Distance Networks*（2023）。[RFC Editor](https://datatracker.ietf.org/doc/rfc9438/)
:::

:::en
- [S1] M. Allman, V. Paxson, and E. Blanton, RFC 5681, *TCP Congestion Control* (2009). [RFC Editor](https://datatracker.ietf.org/doc/rfc5681/)
- [S2] I. Rhee et al., RFC 9438, *CUBIC for Fast and Long-Distance Networks* (2023). [RFC Editor](https://datatracker.ietf.org/doc/rfc9438/)
:::
