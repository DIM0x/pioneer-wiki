:::zh
**垃圾回收**（GC）是运行时根据对象可达性自动回收不再被程序引用的内存的机制。它减轻手动释放和悬空指针风险，但不等于“内存会自动无限增长后再清干净”：回收器仍消耗 CPU 和带宽，堆空间有上限，回收时机也受语言与运行时策略控制。[S1][S2]
:::

:::en
**Garbage collection** (GC) is a runtime mechanism that reclaims memory for objects that are no longer reachable from a program's references. It reduces the burden of manual freeing and the risk of dangling pointers, but it does not mean memory can grow without bound until everything is cleaned up. A collector consumes CPU and bandwidth, heaps have limits, and collection timing depends on the language and runtime policy. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
对象何时可回收取决于运行时定义的根集合和引用图：线程栈、静态字段、寄存器或运行时句柄中的引用可以让对象保持可达。不可达不等于业务上“不再需要”，而只表示从当前根集合无法继续遍历到对象。文件句柄、数据库连接和锁等外部资源不能只依赖内存回收，因为对象可能长期可达或在任意时刻才被回收；应使用显式关闭、`try/finally`、上下文管理器或确定性析构协议。[S1]
:::

:::en
Whether an object can be reclaimed depends on the runtime's root set and reference graph. References in thread stacks, static fields, registers, or runtime handles can keep an object reachable. Unreachable does not mean “no longer needed by the business”; it means the object cannot be traversed from the current roots. External resources such as file handles, database connections, and locks should not rely only on memory collection. An object may remain reachable for a long time or be collected at an arbitrary time, so use explicit close operations, `try/finally`, context managers, or deterministic disposal protocols. [S1]
:::

## 工作机制 | How it works

:::zh
追踪式回收器从根开始标记可达对象，再回收未标记空间；复制式或压缩式算法还会移动对象，以减少碎片。分代回收利用了许多新对象很快死亡的经验规律，把年轻代与老年代区别处理；增量或并发算法把部分工作分散到程序运行期间，但需要写屏障等机制保持图状态一致。[S1] Java G1 是面向较低停顿目标的回收器；OpenJDK 将其默认化时明确把停顿时长与最大吞吐之间的取舍列为动机。目标用于指导选择，不保证每次暂停都有固定上限。[S2]
:::

:::en
A tracing collector marks reachable objects from roots, then reclaims unmarked space. Copying and compacting collectors may also move objects to reduce fragmentation. Generational collection uses the empirical observation that many new objects die quickly, treating young and old objects differently. Incremental or concurrent algorithms distribute some work while the program runs, using mechanisms such as write barriers to keep the object graph coherent. [S1] Java's G1 is a collector designed around a lower-pause-time goal; OpenJDK's decision to make it the default explicitly describes the trade-off between pause duration and maximum throughput. The goal guides choices but does not guarantee a fixed upper bound for every pause. [S2]
:::

## 一个例子 | A worked example

:::zh
一个请求处理器为每个请求创建临时解析对象，并把结果对象放入短期缓存。请求结束后，局部引用消失，临时对象在下一次年轻代回收时可能被回收；缓存中的对象仍可从根集合到达，因而继续占用堆。若缓存没有容量或过期策略，GC 再勤奋也无法释放这些“仍被引用”的对象。监测时可同时看分配速率、存活对象、堆使用量和暂停时间，再判断应减少分配、限制缓存还是调整回收器。
:::

:::en
A request handler creates temporary parsing objects and places result objects in a short-lived cache. When the request ends, local references disappear, so temporary objects may be reclaimed in a later young-generation collection. Cached objects remain reachable from roots and continue to occupy heap space. No amount of eager GC can release objects that are still referenced; the cache needs capacity or expiration rules. Monitoring allocation rate, live objects, heap use, and pause time together helps distinguish whether to reduce allocations, bound the cache, or tune the collector.
:::

## 局限与误解 | Limits and misconceptions

:::zh
GC 不会自动修复逻辑泄漏：全局集合、监听器或缓存意外保留引用时，对象仍可达。回收可能带来吞吐损失、暂停或尾延迟抖动；并发回收也会与应用争用 CPU 和内存带宽。手动内存管理并非必然更快，而 GC 也不意味着无需理解对象生命周期。系统设计要测量分配与存活模式，显式管理非内存资源，并根据延迟目标选择运行时。硬实时场景可能要求可预测、受约束的分配策略，而不适合依赖不确定暂停。[S1][S2]
:::

:::en
GC does not automatically fix logical leaks: if a global collection, listener, or cache accidentally retains a reference, the object remains reachable. Collection can reduce throughput, pause execution, or add tail-latency variation; concurrent collection also competes with the application for CPU and memory bandwidth. Manual memory management is not necessarily faster, and GC does not remove the need to understand object lifetimes. Measure allocation and survival patterns, manage non-memory resources explicitly, and choose a runtime that fits latency goals. Hard real-time systems may need predictable, constrained allocation strategies that avoid reliance on nondeterministic pauses. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[操作系统内核](/entries/os-kernel)管理进程地址空间和物理页；[存储层次](/entries/memory-hierarchy)说明堆访问的缓存行为；[编程语言](/entries/programming-languages)讨论语言如何定义内存与资源生命周期。
:::

:::en
[Operating System Kernel](/entries/os-kernel) manages process address spaces and physical pages. [Memory Hierarchy](/entries/memory-hierarchy) explains cache behavior during heap access. [Programming Languages](/entries/programming-languages) covers how languages define memory and resource lifetimes.
:::

## 参考资料 | References

:::zh
- [S1] Microsoft Learn，*Fundamentals of garbage collection*，.NET 文档。[官方文档](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals)
- [S2] OpenJDK，JEP 248，*Make G1 the Default Garbage Collector*（2015）。该提案说明 G1 的停顿时间目标与吞吐取舍。[提案](https://openjdk.org/jeps/248)
:::

:::en
- [S1] Microsoft Learn, “Fundamentals of garbage collection,” .NET documentation. [Official documentation](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals)
- [S2] OpenJDK, JEP 248, “Make G1 the Default Garbage Collector” (2015). The proposal discusses G1's pause-time goals and throughput trade-off. [JEP](https://openjdk.org/jeps/248)
:::
