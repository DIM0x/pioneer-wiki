:::zh
**存储层次**把容量、成本、持久性和访问延迟不同的存储组件组织成多级系统。处理器附近的寄存器和缓存很快但容量小；主存更大但延迟更高；SSD、硬盘和远端存储容量及持久性更强，却通常需要更多时间访问。层次结构依赖时间与空间局部性，让常用数据留在更靠近处理器的位置。[S1][S2]
:::

:::en
The **memory hierarchy** organizes storage components with different capacities, costs, persistence, and access latencies into multiple levels. Registers and caches near a processor are fast but small; main memory is larger and slower; SSDs, disks, and remote storage offer greater capacity or persistence but usually take longer to access. The hierarchy relies on temporal and spatial locality, keeping frequently used data closer to the processor. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
“层次”不是一条固定、整齐的硬件清单，而是某一系统把数据从更快、更贵的层映射到更慢、更便宜的层的方式。判断效率时要区分命中与未命中：若所需字节已在当前层，访问以该层延迟完成；否则系统需要从下层取回数据，并可能替换已有内容。缓存行、页面、文件块和对象是不同粒度，不能把 CPU 缓存、操作系统页缓存和数据库缓存混称为同一种缓存。系统还可能具有多个处理器插槽、设备显存或远程缓存，因此实际层次并不总是线性的。[S1]
:::

:::en
“Hierarchy” is not one fixed, tidy hardware list. It describes how a particular system maps data between a faster, more expensive level and a slower, cheaper one. Performance depends on distinguishing a hit from a miss: if the requested bytes are already at the current level, access completes at that level's latency; otherwise the system fetches them from below and may evict existing content. Cache lines, pages, file blocks, and objects are different granularities. A CPU cache, an operating-system page cache, and a database cache should not be collapsed into one concept. Systems can also include multiple sockets, device memory, or remote caches, so the real arrangement need not be linear. [S1]
:::

## 工作机制 | How it works

:::zh
硬件缓存通常以组相联或直接映射结构保存最近使用的缓存行，标签用于判断目标地址是否已驻留。命中时，数据直接提供给处理器；未命中时，控制器从下一级取回包含目标地址的一整行，并按替换策略腾出空间。编译器与程序结构影响访问局部性，操作系统则在页面层管理虚拟内存、缺页和换入换出。硬件和软件共同决定移动成本：预取能提前搬运可能会用到的数据，但误预测会浪费带宽；写策略也会影响数据何时传播到下层。层级通过重复利用而不是“让所有存储都变快”来隐藏平均延迟。[S1][S2]
:::

:::en
Hardware caches commonly store recently used cache lines in direct-mapped or set-associative structures, using address tags to determine whether a line is resident. A hit supplies data to the processor. On a miss, the controller fetches a whole line from the next level and makes room according to a replacement policy. Compiler choices and program layout affect locality; the operating system manages virtual memory at page granularity, including page faults and swapping. Hardware and software share the cost of movement. Prefetching can bring in data early, but a wrong prediction wastes bandwidth; write policies determine when updates propagate to lower levels. The hierarchy hides average latency through reuse rather than making every storage device equally fast. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
遍历一个按行存储的二维数组时，依次访问 `a[i][0]`、`a[i][1]` 等相邻元素，通常会复用同一缓存行。若把循环顺序改成先变化列索引，访问可能在内存中跳跃，导致每次都取入大量暂时不用的字节。算法的数学结果没变，缓存未命中和内存带宽却可能改变数量级。测量时应固定输入规模和机器配置，再用性能计数器观察缓存未命中与内存停顿，而不能只凭代码行数判断快慢。
:::

:::en
While traversing a row-major two-dimensional array, a program that visits `a[i][0]`, `a[i][1]`, and adjacent elements often reuses the same cache line. Reversing the loop order so the column index changes first may jump through memory, fetching many bytes that are not used immediately. The mathematical result is unchanged, but cache misses and memory bandwidth can change substantially. To compare the versions, hold input size and machine configuration steady, then use performance counters to inspect cache misses and memory stalls. Counting source lines is not a useful substitute for measurement.
:::

## 局限与误解 | Limits and misconceptions

:::zh
命中率高不保证延迟稳定：一次缺页、远端 NUMA 访问或设备传输仍可能主导尾延迟。缓存也会引入一致性与失效成本，多核同时写入同一缓存行时甚至会发生伪共享。更大的缓存并非总能更快，工作集超过容量后，替换和带宽压力可能抵消收益。另一个误解是把所有层看成透明且可靠的副本：CPU 缓存通常不具备掉电持久性，持久化需要文件系统、存储设备和显式同步语义。局部性是常见模式，不是任何程序都能依赖的保证。[S1][S2]
:::

:::en
A high hit rate does not guarantee stable latency: a page fault, remote NUMA access, or device transfer can still dominate the tail. Caches also introduce coherence and invalidation costs; concurrent writes to different fields on one cache line can cause false sharing. A larger cache is not always faster, because replacement and bandwidth pressure can erase its benefit once the working set exceeds capacity. Another misconception is to treat every level as a transparent, reliable copy. CPU caches are generally not durable across power loss; persistence depends on file systems, storage devices, and explicit synchronization semantics. Locality is common, but it is not a guarantee that every program can rely on. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[操作系统内核](/entries/os-kernel)解释虚拟内存与页管理；[TCP 拥塞控制](/entries/tcp-congestion-control)展示网络传输中的带宽与队列权衡；[分布式系统](/entries/distributed-systems)扩展到远端节点之间的复制和协调。
:::

:::en
[Operating System Kernel](/entries/os-kernel) covers virtual memory and page management. [TCP Congestion Control](/entries/tcp-congestion-control) shows bandwidth and queue trade-offs in network transport. [Distributed Systems](/entries/distributed-systems) extends the discussion to replication and coordination among remote nodes.
:::

## 参考资料 | References

:::zh
- [S1] Ulrich Drepper，*What Every Programmer Should Know About Memory*（2007），处理器缓存与存储层次章节。[PDF](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
- [S2] Randal E. Bryant 与 David R. O'Hallaron，《Computer Systems: A Programmer's Perspective》，涵盖缓存、存储层次和虚拟内存的系统教材。[作者课程网站](https://csapp.cs.cmu.edu/3e/home.html)
- [S3] Remzi H. Arpaci-Dusseau 与 Andrea C. Arpaci-Dusseau，《Operating Systems: Three Easy Pieces》，第 13 章“地址空间”。[章节 PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf)
:::

:::en
- [S1] Ulrich Drepper, *What Every Programmer Should Know About Memory* (2007), chapters on processor caches and the memory hierarchy. [PDF](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
- [S2] Randal E. Bryant and David R. O'Hallaron, *Computer Systems: A Programmer's Perspective*, a systems textbook covering caches, the memory hierarchy, and virtual memory. [Authors' course site](https://csapp.cs.cmu.edu/3e/home.html)
- [S3] Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, Chapter 13, “Address Spaces.” [Chapter PDF](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf)
:::
