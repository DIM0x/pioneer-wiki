:::zh
**性能分析**通过可重复测量判断系统把时间、CPU、内存、I/O 或网络资源花在哪里，再定位限制吞吐或延迟的瓶颈。它不是先挑一个函数“优化”，而是把用户可见结果和底层资源证据连起来：目标负载下发生了什么、哪个资源饱和、变化是否改善目标指标。[S1][S2]
:::

:::en
**Performance analysis** uses repeatable measurements to determine where a system spends time, CPU, memory, I/O, or network resources, then identifies what limits throughput or latency. It does not begin by choosing a function to “optimize.” It connects user-visible outcomes with resource evidence: what happened under the target workload, which resource saturated, and whether a change improved the intended metric. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
先定义目标：交互服务关注响应延迟及其分位数，批处理关注完成时间与单位成本，数据库可能同时关注吞吐、尾延迟和写放大。基准测试需要固定输入、并发度、软件版本、硬件、预热和采样窗口。USE 方法按每项资源检查利用率、饱和度和错误：利用率说明资源忙碌程度，饱和度说明请求是否排队，错误记录资源操作失败。它帮助建立系统性调查顺序，但不是所有问题都能仅靠三个指标解释。[S1]
:::

:::en
Define the goal first. An interactive service cares about response latency and its percentiles; a batch job cares about completion time and cost per unit; a database may care about throughput, tail latency, and write amplification together. A benchmark should fix its input, concurrency, software version, hardware, warm-up, and sampling window. The USE method checks each resource for utilization, saturation, and errors: utilization describes how busy it is, saturation whether work is queuing, and errors whether operations failed. USE provides a systematic investigation order, but not every problem can be explained by only these three measures. [S1]
:::

## 工作机制 | How it works

:::zh
先记录基线，再从外到内定位：确认用户请求的延迟和失败率，查看主机、进程和设备指标，找出饱和资源后采集剖析数据。采样剖析器按时间或硬件事件抽样调用栈，追踪器则记录一次请求经过的阶段；二者分别适合定位热点和解释跨组件等待。按固定负载复测后，比较中位数、p95/p99、吞吐和资源使用，并检查置信区间或多次运行差异。一次只改一个主要因素，有助于把结果归因到实际改变。[S1][S2]
:::

:::en
Record a baseline, then work from the outside in: measure request latency and failures, inspect host, process, and device metrics, identify a saturated resource, and collect profile data. A sampling profiler uses time or hardware events to collect call stacks; a tracer records stages within one request. The former helps find hot code, while the latter explains waits across components. Re-run a fixed workload and compare median, p95/p99, throughput, and resource use. Examine confidence intervals or variation across runs. Changing one major factor at a time makes it easier to attribute a result to the actual change. [S1][S2]
:::

:::zh
对 CPU 密集型请求，火焰图可以显示哪些调用栈贡献了较多采样时间；对等待较多的请求，分布式追踪或 off-CPU 分析可能更有解释力。采样只是估计，并非逐次调用计数：低频事件容易漏掉，密集插桩也会改变调度与时间。应从剖析结果提出可验证假设，再用受控对照和用户侧指标确认。
:::

:::en
For a CPU-bound request, a flame graph can show which call stacks account for sampled CPU time; for a waiting-heavy request, distributed traces and off-CPU analysis may be more informative. Sampling is an estimate, not a count of every invocation. Low-frequency events can be missed, while aggressive instrumentation can change scheduling and timing. Use profiles to form a specific hypothesis, then confirm it with a controlled comparison and user-facing metric.
:::

## 一个例子 | A worked example

:::zh
某 API 的 p99 延迟升高，但平均 CPU 利用率只有 40%。先按 USE 查看每核和每设备指标，发现磁盘写队列持续增长；随后用请求追踪确认慢请求都等待提交日志，再用剖析器发现同步刷盘频繁。候选改动是批量合并写入。改动前后使用相同请求分布、并发和数据集运行多轮，比较 p99、吞吐、磁盘饱和度及确认语义。若延迟下降但数据耐久性承诺变化，就不能把它视为无条件的性能提升。
:::

:::en
An API's p99 latency rises while average CPU utilization is only 40 percent. Per-core and per-device USE checks reveal a growing disk write queue. Request traces show that slow requests wait for a log commit, and a profile shows frequent synchronous flushes. One candidate is to batch writes. Before and after the change, run the same request distribution, concurrency, and dataset for several trials; compare p99, throughput, disk saturation, and acknowledgment semantics. If latency falls because the durability promise changed, that is not an unconditional performance improvement.
:::

## 局限与误解 | Limits and misconceptions

:::zh
平均值会掩盖长尾，单次运行会受到后台任务、缓存冷热和热频率影响；监测工具本身也有开销。CPU 使用率低不代表系统空闲，线程可能在锁、网络或 I/O 上等待；堆栈采样命中多也不一定说明某行代码是根因。微基准的赢家未必改善真实端到端负载，局部缓存也可能增加失效成本。应报告环境、样本量、分布和限制，先验证瓶颈，再优化并再次测量。优化目标还要包含正确性、成本与复杂度，而不能只追求最快的实验室数字。[S1][S2]
:::

:::en
Averages hide long tails, and a single run is affected by background work, cache warmth, and CPU frequency. Monitoring tools have overhead too. Low CPU use does not mean the system is idle: threads may wait on locks, networks, or I/O. A frequently sampled stack frame is not necessarily the root cause. A microbenchmark winner may not improve an end-to-end workload, and a local cache can add invalidation costs. Report the environment, sample size, distribution, and limitations. Verify the bottleneck before optimizing, then measure again. Correctness, cost, and complexity belong in the objective alongside speed; the fastest laboratory number is not the whole result. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[存储层次](/entries/memory-hierarchy)解释缓存未命中与内存带宽；[缓存行](/entries/cache-line)说明多核共享缓存中的伪共享；[可重复部署](/entries/repeatable-deployment)帮助固定基准环境与软件制品。
:::

:::en
[Memory Hierarchy](/entries/memory-hierarchy) explains cache misses and memory bandwidth. [Cache Line](/entries/cache-line) covers false sharing in coherent multicore caches. [Repeatable Deployment](/entries/repeatable-deployment) helps pin the software artifact and benchmark environment.
:::

## 参考资料 | References

:::zh
- [S1] Brendan Gregg，*The USE Method*。[方法说明](https://www.brendangregg.com/usemethod.html)
- [S2] Brendan Gregg，*Linux perf Examples*。[性能分析示例](https://www.brendangregg.com/perf.html)
:::

:::en
- [S1] Brendan Gregg, *The USE Method*. [Method guide](https://www.brendangregg.com/usemethod.html)
- [S2] Brendan Gregg, *Linux perf Examples*. [Performance-analysis examples](https://www.brendangregg.com/perf.html)
:::
