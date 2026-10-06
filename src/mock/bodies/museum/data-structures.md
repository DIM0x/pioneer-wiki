:::zh
**数据结构**是对数据元素、关系和可执行操作的组织方式，目的是让目标操作在给定时间、空间和一致性约束下可行。数组、链表、哈希表、树和图各自提供不同的访问、插入、删除与遍历成本；选择结构时要结合数据规模、访问模式、更新频率和内存布局，而不是只比较抽象复杂度。[S1][S2]
:::

:::en
A **data structure** organizes data elements, relationships, and permitted operations so that intended work fits given time, space, and consistency constraints. Arrays, linked lists, hash tables, trees, and graphs offer different costs for access, insertion, deletion, and traversal. Choosing one requires considering data size, access patterns, update frequency, and memory layout, not just asymptotic complexity. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
抽象数据类型描述操作和语义，例如集合要求成员测试与去重；数据结构是满足这些语义的具体表示。一个集合可由哈希表、排序数组或平衡树实现，性能特征不同。复杂度用输入规模增长趋势比较算法，常数、分配、缓存未命中和并发锁仍会影响真实运行。还要区分逻辑关系与物理布局：图可以用邻接表或矩阵表示，前者适合稀疏图，后者让边查询直接但可能浪费空间。[S1]
:::

:::en
An abstract data type describes operations and their semantics; a data structure is a concrete representation that satisfies them. A set, for example, can be implemented with a hash table, sorted array, or balanced tree, each with different performance characteristics. Complexity compares how work grows with input size, but constants, allocation, cache misses, and concurrent locks still affect real execution. Distinguish logical relationships from physical layout as well: a graph can use adjacency lists or a matrix. Lists suit sparse graphs, while a matrix offers direct edge lookup at the cost of potentially wasted space. [S1]
:::

## 工作机制 | How it works

:::zh
数组将元素连续放置，索引访问成本稳定，但中间插入通常要移动后续元素；链表把节点分散存放，已知节点时插入便捷，却需要逐步遍历且指针占空间。哈希表把键映射到桶，平均可快速查找，但哈希冲突、扩容和负载因子决定实际代价。搜索树按键序组织节点，支持有序遍历与范围查询；平衡约束防止退化成链。实际实现还要规定键相等性、迭代顺序、并发安全与内存分配策略。[S1][S2]
:::

:::en
An array stores elements contiguously, giving stable indexed access, but inserting in the middle usually moves later elements. A linked list scatters nodes and makes insertion convenient when the node is already known, but traversal is sequential and pointers consume space. A hash table maps keys to buckets for fast average lookup, while collisions, resizing, and load factor affect actual cost. A search tree organizes nodes by key and supports ordered traversal and range queries; balancing prevents it from degenerating into a chain. Implementations must also specify key equality, iteration order, concurrency safety, and allocation policy. [S1][S2]
:::

:::zh
对可变长度集合，动态数组通常按倍数扩容，以较少的偶发搬移换取摊还常数时间追加；若应用预知规模，可以预留容量降低复制峰值。哈希表的平均查找成本依赖哈希分布和扩容策略，稳定 API 不代表稳定迭代顺序。选实现时需查明语言库的具体保证，把抽象复杂度和库契约分开。
:::

:::en
For a growing collection, a dynamic array commonly expands geometrically, trading occasional copying for amortized constant-time append. Reserving capacity when size is known can reduce peak copying. A hash table's average lookup cost also depends on hash distribution and resizing policy; a stable API does not necessarily promise stable iteration order. Check a language library's guarantees and keep them separate from abstract complexity claims.
:::

## 一个例子 | A worked example

:::zh
一个排行榜需要按分数查询前十名，也需要按玩家 ID 更新分数。只用数组更新很简单，但每次展示榜单都要排序；只用哈希表更新快，却不能直接按分数取前十。可以用按 ID 索引的哈希表存玩家当前分数，再用平衡搜索树或堆维护排名结构；更新时先移除旧分数记录，再插入新记录。若排行榜只有几十人，简单排序数组反而更省事，因此应在真实规模上验证复杂度和实现成本。
:::

:::en
A leaderboard needs to retrieve the top ten scores and update a score by player ID. An array makes updates simple, but displaying the board requires sorting each time. A hash table makes updates fast but cannot directly return the top scores in order. One design uses a hash table indexed by ID for current scores and a balanced search tree or heap for rankings; an update removes the old score record before inserting the new one. If the board has only a few dozen players, a sorted array may be simpler overall. Validate complexity and implementation cost at the real scale.
:::

## 局限与误解 | Limits and misconceptions

:::zh
“O(1)”通常是期望或摊还界，不是每次操作都固定一个 CPU 周期；哈希表在冲突或恶意输入下可能退化，动态数组扩容也会有偶发线性成本。理论上渐近复杂度更优的结构可能因指针跳转、缓存局部性差或分配开销而更慢。并发场景还需考虑锁竞争和读写一致性。结构选择没有脱离操作负载的最佳答案：先写出不变量与查询模式，再用具有代表性的数据和基准比较。
:::

:::en
“O(1)” is usually an expected or amortized bound, not a fixed number of processor cycles for every operation. A hash table can degrade under collisions or adversarial input, and a dynamic array occasionally pays linear cost during resizing. A structure with better asymptotic complexity may run more slowly because of pointer chasing, poor locality, or allocation overhead. Concurrent workloads also need to account for lock contention and read/write consistency. There is no best structure independent of workload: state invariants and query patterns first, then compare representative data with a benchmark.
:::

## 相关条目 | Related entries

:::zh
[B 树](/entries/b-tree)是面向块存储和范围查询的多路搜索树；[布隆过滤器](/entries/bloom-filter)用概率换取低内存成员测试；[数据库](/entries/databases)展示结构如何服务持久化索引与事务。
:::

:::en
[B-tree](/entries/b-tree) is a multiway search tree designed for block storage and range queries. [Bloom Filter](/entries/bloom-filter) trades exactness for low-memory membership checks. [Databases](/entries/databases) shows how structures support persistent indexes and transactions.
:::

## 参考资料 | References

:::zh
- [S1] Virginia Tech OpenDSA，CS3 *Data Structures & Algorithms*，第 1.1 节：选择数据结构时从目标工作负载与性能要求出发。[开放教材章节](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/IntroDSA.html)
- [S2] MIT OpenCourseWare，*Introduction to Algorithms*，课程讲义。[讲义页](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
:::

:::en
- [S1] Virginia Tech OpenDSA, CS3 *Data Structures & Algorithms*, Section 1.1, selecting structures from workload and performance goals. [Open textbook chapter](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/IntroDSA.html)
- [S2] MIT OpenCourseWare, *Introduction to Algorithms*, course lecture notes. [Lecture-note index](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
:::
