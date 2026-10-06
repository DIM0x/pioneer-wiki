:::zh
**缓存行**是处理器缓存与相邻存储层之间传输和维护一致性的固定大小数据块。即使程序只读取一个字段，缓存也通常把包含它的整行载入；相邻字节因此可以在空间局部性下快速复用。缓存行还参与多核一致性协议，多个核心写入同一行时，即使目标变量不同，也可能相互干扰。[S1][S2]
:::

:::en
A **cache line** is a fixed-size block transferred between a processor cache and the next storage level, and tracked for coherence. Even when a program reads one field, the cache usually fetches the whole line containing it, allowing nearby bytes to benefit from spatial locality. Cache lines also participate in multicore coherence: cores writing different variables on the same line can interfere with one another. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
缓存行大小由处理器实现决定。内存地址划分出行偏移、组索引与标签，处理器据此判断数据是否命中以及应放入哪个缓存组。多核一致性协议以缓存行为单位追踪共享与修改状态；某核心写入时，其他核心的副本可能被失效。缓存行不是语言层面的变量、原子操作或锁。对齐、填充和访问顺序会影响布局，但编译器、分配器和硬件仍可能改变最终地址。[S1][S2]
:::

:::en
Line size is an implementation choice. Address bits identify the line offset, set, and tag so the processor can determine whether data is present and where it belongs. Multicore coherence protocols track sharing and modification at cache-line granularity; a write by one core may invalidate copies held by others. A cache line is not a language-level variable, atomic operation, or lock. Alignment, padding, and access order affect layout, but compilers, allocators, and hardware can still change final addresses. [S1][S2]
:::

## 工作机制 | How it works

:::zh
读取未命中的地址时，缓存控制器从更低一级取入整行，并可能替换同一组中的旧行。写入时，写回或直写策略决定何时向下一级传播；一致性协议还维护多个核心看到的值。若两个线程在不同核心持续修改同一行中的不同计数器，行的所有权可能在核心间反复转移，产生“伪共享”。这不是数据竞争，也不会自动导致结果错误，但会增加一致性流量并降低吞吐。把计数器分到不同缓存行可减少干扰，不过会增加内存占用。[S1][S2]
:::

:::en
On a cache miss, the controller fetches an entire line from a lower level and may evict an older line from the same set. Write-back or write-through policy determines when updates move downward; coherence protocols maintain the values visible to multiple cores. If two threads on different cores repeatedly modify separate counters that share one line, ownership can bounce between cores. This is called false sharing. It is not a data race and does not automatically produce a wrong result, but it adds coherence traffic and reduces throughput. Separating counters onto different lines can reduce interference at the cost of extra memory. [S1][S2]
:::

:::zh
写入未命中时，一些架构会先取得该行的独占所有权，再修改内容。因此，即使字段很小，一个核心的写入也可能触发一致性消息。这解释了“伪共享”一词：线程没有共享同一个语言层变量，但硬件会把它们所在的整行作为单位跟踪。具体一致性协议依处理器实现而异。
:::

:::en
On a write miss, some architectures first obtain exclusive ownership of the line before modifying it. A write by one core can therefore cause coherence messages even if the updated field is tiny. This is why a cache-line transfer is sometimes described as false sharing: threads do not share a source-language variable, but the hardware tracks their containing line as one unit. The exact protocol is implementation-specific.
:::

## 一个例子 | A worked example

:::zh
一个并行程序让每个工作线程累加自己的计数器，最后汇总。如果计数器恰好连续存放在同一缓存行，不同核心每次更新都可能使其他核心的副本失效。性能剖析显示 CPU 利用率很高而吞吐扩展不佳。通过结构填充或线程本地存储，把计数器分散到独立行后，跨核心失效减少；但应先用硬件计数器和目标负载确认伪共享，避免仅凭源码相邻就过度填充。
:::

:::en
A parallel program lets each worker increment its own counter and combines the totals at the end. If the counters happen to share a cache line, updates on different cores can invalidate one another's copies. A profile may show high CPU use with poor scaling. Padding the structure or using thread-local storage to separate counters can reduce cross-core invalidations. First confirm false sharing with hardware counters and a representative workload; source-level adjacency alone is not enough reason to add padding everywhere.
:::

## 局限与误解 | Limits and misconceptions

:::zh
填充会增大工作集，可能让缓存容量压力更糟；不同处理器和编译目标的行大小也可能不同。伪共享只有在多核频繁写入且行发生迁移时才显著，读取共享数据通常是正常共享。把字段拆开还可能破坏局部性或序列化布局。优化时应先确定实际缓存行大小与热点，再比较调整前后的延迟、吞吐和缓存一致性事件。缓存行解释的是硬件移动和一致性的粒度，不是应用必须手工维护的对象边界。[S1][S2]
:::

:::en
Padding enlarges the working set and can make cache-capacity pressure worse. Line size can also differ across processors and compilation targets. False sharing matters when multiple cores frequently write and ownership moves between them; read-only sharing is ordinary sharing. Splitting fields may also hurt locality or serialized layout. Identify the actual line size and hot path before optimizing, then compare latency, throughput, and coherence events. A cache line describes the hardware granularity of movement and coherence, not an object boundary that applications must always manage manually. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[存储层次](/entries/memory-hierarchy)说明缓存如何逐级装载数据；[性能分析](/entries/performance-analysis)介绍用剖析器和硬件计数器验证瓶颈；[操作系统内核](/entries/os-kernel)讨论多核调度和共享内存。
:::

:::en
[Memory Hierarchy](/entries/memory-hierarchy) explains how caches load data across levels. [Performance Analysis](/entries/performance-analysis) covers profiling and hardware counters for bottleneck diagnosis. [Operating System Kernel](/entries/os-kernel) discusses multicore scheduling and shared memory.
:::

## 参考资料 | References

:::zh
- [S1] Linux Kernel Documentation，*False Sharing*，内核调试说明。[官方文档](https://docs.kernel.org/kernel-hacking/false-sharing.html)
- [S2] Intel，*Intel 64 and IA-32 Architectures Software Developer's Manuals*，缓存与内存类型相关章节。[官方手册入口](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
:::

:::en
- [S1] Linux Kernel Documentation, “False Sharing,” kernel-hacking guide. [Official documentation](https://docs.kernel.org/kernel-hacking/false-sharing.html)
- [S2] Intel, *Intel 64 and IA-32 Architectures Software Developer's Manuals*, sections on caches and memory types. [Manuals portal](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
:::
