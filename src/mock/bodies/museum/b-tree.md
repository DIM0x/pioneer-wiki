:::zh
**B 树**是为块存储设计的平衡多路搜索树，每个节点可容纳许多键和子指针。与二叉搜索树每层只分出少量分支不同，B 树让一个节点的多个键共同分隔多个子树，从而降低树高、减少磁盘或页面访问次数。数据库与文件系统索引常使用 B 树家族结构；具体实现可能采用 B+ 树、变体或页面级优化，不应把所有实现细节视为同一规范。[S1][S2]
:::

:::en
A **B-tree** is a balanced multiway search tree designed for block storage. Each node can hold many keys and child pointers. Unlike a binary search tree, which branches only a few ways at each level, a B-tree uses multiple keys in one node to separate many subtrees, reducing tree height and disk or page accesses. Database and file-system indexes commonly use B-tree-family structures. A particular implementation may use a B+ tree, a variant, or page-level optimizations, so not every implementation detail should be treated as one universal specification. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
节点中的键按顺序排列，搜索时从根开始比较目标键与分隔键，选择对应子树，直到命中键或叶节点。除根节点外，节点需保持规定的最小和最大占用范围；插入后溢出会分裂节点并可能提升中间键，删除后占用过低则通过借位或合并修复。所有叶子位于同一深度，树因此保持平衡。B+ 树把记录或记录指针主要放在叶子中，并以链接叶子支持范围扫描；这是常见变体，不是所有 B 树定义都必须具备的属性。[S1]
:::

:::en
Keys within a node are ordered. A search begins at the root, compares the target with separator keys, follows the corresponding child, and continues until it finds the key or reaches a leaf. Except for the root, nodes must remain within specified minimum and maximum occupancy bounds. An overflowing insertion splits a node and may promote a separator key; an underfull deletion is repaired by borrowing from a neighbor or merging nodes. All leaves stay at the same depth, keeping the tree balanced. A B+ tree stores records or record pointers mainly in leaves and links leaves for range scans. This is a common variant, not a required property of every B-tree definition. [S1]
:::

## 工作机制 | How it works

:::zh
在实际数据库中，节点通常对应磁盘或内存页面，而不是每个键单独分配一个对象。分隔键和孩子指针放在同一页，可在一次页面读取中进行多次比较；页内搜索可用线性扫描或二分查找。高扇出降低访问层数，但更宽的键会减少每页可容纳的项数，增加树高。范围扫描还会受叶页布局、并发插入与页分裂影响，因此基准要包含真实键宽和更新比例。
:::

:::en
In a database, nodes usually correspond to disk or memory pages rather than separately allocated objects for each key. Keeping separator keys and child pointers together allows several comparisons after one page read; the implementation may use a linear scan or binary search within the page. Higher fan-out reduces levels, but wider keys mean fewer entries per page and can increase tree height. Range scans also depend on leaf layout, concurrent inserts, and page splits, so benchmarks should use realistic key widths and update rates.
:::

:::zh
实现还要决定如何处理并发读写。数据库可能通过页锁、闩锁或乐观校验保护节点修改，并用日志确保分裂后崩溃恢复时不会留下无法到达的子页。删除后不一定立即合并页面，因为空间可以留给后续插入；物理树因此可能比理论上最紧凑的树更稀疏。读取和写入优化之间的权衡，需要由索引维护策略共同决定。
:::

:::en
Implementations must also decide how concurrent reads and writes are protected. A database may use page locks, latches, or optimistic validation for node changes, and logging so a crash during a split does not leave an unreachable child page. A deletion need not trigger an immediate merge; space can be retained for future inserts. The physical tree may therefore be sparser than the theoretically most compact tree. Index-maintenance policy is part of the trade-off between read and write performance.
:::

## 一个例子 | A worked example

:::zh
假设数据库页面可容纳数百个索引键，数十亿行数据对应的索引也可能只有几层。查询订单号时，数据库每次读取一个页面并按分隔键选择下一页；到叶子后获得记录位置，再读取表数据。范围查询则从起始叶项向相邻叶页顺序扫描。若页容量更小，树更高，随机 I/O 增加；若页更大，单次读取和缓存占用增加。节点容量与填充率需要结合设备、键宽和写入模式调优。
:::

:::en
Suppose a database page can hold hundreds of index keys. Even an index for billions of rows may then have only a few levels. To look up an order number, the database reads a page at each level and follows the child selected by a separator key. At the leaf it finds a record location and then reads the table row. A range query can scan forward from its starting leaf entry across adjacent leaf pages. Smaller pages may create a taller tree and more random I/O; larger pages increase each read and cache footprint. Page capacity and fill factor must fit the device, key width, and write workload.
:::

## 局限与误解 | Limits and misconceptions

:::zh
B 树查询常用 `O(log n)` 表示层数随数据增长，但实际代价还取决于节点扇出、页读取、缓存命中和键比较。索引不是免费的：插入、删除、页分裂和并发锁会增加写入成本。随机分布的 UUID 等宽键可能使索引更大、更难局部访问；前缀相近的键则有不同局部性。数据库可能根据选择率放弃索引，全表扫描更便宜时这是正常优化。还需区分逻辑树与实现：页压缩、并发分裂、日志和回收策略均由具体系统决定。[S1][S2]
:::

:::en
B-tree lookup is often described as `O(log n)` because the number of levels grows logarithmically, but real cost also depends on fan-out, page reads, cache hits, and key comparisons. An index is not free: inserts, deletes, page splits, and concurrency control add write cost. Wide random keys such as UUIDs can make an index larger and less local; keys with shared prefixes behave differently. A database may skip an index based on selectivity, and that is normal when a table scan is cheaper. The logical tree must also be distinguished from an implementation: page compression, concurrent splits, logging, and reclamation are system-specific. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据结构](/entries/data-structures)给出树与平衡结构的基础；[数据库](/entries/databases)解释查询规划、索引维护和事务；[存储层次](/entries/memory-hierarchy)说明页面读取如何受缓存和设备延迟影响。
:::

:::en
[Data Structures](/entries/data-structures) introduces trees and balanced structures. [Databases](/entries/databases) covers query planning, index maintenance, and transactions. [Memory Hierarchy](/entries/memory-hierarchy) explains how page reads interact with caches and device latency.
:::

## 参考资料 | References

:::zh
- [S1] Virginia Tech OpenDSA，CS3 *Data Structures & Algorithms*，第 12.6 节 B-Trees。[开放教材章节](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/BTree.html)
- [S2] SQLite Documentation，*Database File Format*，B-tree pages。[官方文档](https://www.sqlite.org/fileformat2.html#b_tree_pages)
:::

:::en
- [S1] Virginia Tech OpenDSA, CS3 *Data Structures & Algorithms*, Section 12.6, “B-Trees.” [Open textbook chapter](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/BTree.html)
- [S2] SQLite Documentation, “Database File Format,” B-tree pages. [Official documentation](https://www.sqlite.org/fileformat2.html#b_tree_pages)
:::
