:::zh
没有一种存储器同时又快、又大、又便宜。**存储层级**用多层存储器的组合来逼近这个理想：常用的数据放在靠近处理器的小而快的层级，其余的放在远处大而慢的层级。
:::

:::en
No memory is fast, large and cheap at once. The **memory hierarchy** approximates that ideal by layering memories: data in frequent use sits in small, fast levels near the processor, everything else in large, slow levels further away.
:::

## 典型的访问时延 | Typical access latencies

| 层级 Level | 容量 Size | 时延 Latency |
| --- | --- | --- |
| 寄存器 Registers | ~1 KB | ~0.3 ns |
| L1 缓存 L1 cache | 32–64 KB | ~1 ns |
| L2 缓存 L2 cache | 0.5–2 MB | ~4 ns |
| L3 缓存 L3 cache | 8–64 MB | ~15 ns |
| 主存 DRAM | 8–512 GB | ~80 ns |
| 固态硬盘 NVMe SSD | TB | ~20 µs |

## 局部性 | Locality

:::zh
层级之所以有效，是因为程序表现出**时间局部性**（刚访问过的数据很快会再被访问）与**空间局部性**（相邻的数据往往一起被访问）。缓存行与预取正是为空间局部性而设计的。
:::

:::en
The hierarchy works because programs show **temporal locality** (data used recently is soon used again) and **spatial locality** (neighbouring data tends to be used together). Cache lines and prefetching exist to exploit the latter.
:::

$$
t_{\text{avg}} = t_{\text{hit}} + m \cdot t_{\text{miss}}
$$
