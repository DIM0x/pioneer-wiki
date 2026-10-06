:::zh
**布隆过滤器**是用位数组和多个哈希函数表示成员集合的概率型数据结构。查询结果为“不存在”时可以确定元素未被插入；结果为“可能存在”时则有一定误报概率。它用少量内存换取快速过滤，适合在访问昂贵存储之前跳过确定不存在的键。[S1][S2]
:::

:::en
A **Bloom filter** is a probabilistic data structure that represents set membership with a bit array and multiple hash functions. A result of “absent” proves that an element was not inserted; “possibly present” has some probability of being a false positive. It trades a small memory footprint for fast filtering and can skip keys that are certainly absent before an expensive storage lookup. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
插入元素时，过滤器计算 `k` 个位置并把对应位设为 1；查询时只要有任一位为 0，就返回不存在，否则返回可能存在。不同元素可能共享位置，因此误报会随位数组占用增大。在每个哈希位置近似独立且均匀分布的理想模型下，插入 `n` 个元素到 `m` 位、使用 `k` 个哈希函数的误报率近似为 `p ≈ (1 - e^(-kn/m))^k`；给定 `m` 与 `n` 时，近似最优 `k = (m/n) ln 2`。具体实现可能用双重哈希等方法近似多次独立取样；实际误报率还受哈希质量、容量估计和实现策略影响。[S1]
:::

:::en
On insertion, the filter computes `k` positions and sets the corresponding bits to 1. On lookup, any zero bit proves absence; if all are set, the answer is “possibly present.” Different elements can share positions, so the false-positive probability rises as the bit array fills. Under a model where hash positions are approximately independent and uniform, inserting `n` elements into `m` bits with `k` hash functions gives an approximate false-positive rate of `p ≈ (1 - e^(-kn/m))^k`. For given `m` and `n`, the approximate optimal number of hash functions is `k = (m/n) ln 2`. Concrete implementations may approximate independent samples with methods such as double hashing; real rates also depend on hash quality, capacity estimates, and implementation. [S1]
:::

## 工作机制 | How it works

:::zh
过滤器对每个键执行哈希并更新若干位，不保存原始键，也不能从位数组恢复元素列表。查询时再次计算相同位置即可得到否定或可能肯定的结果。位数组越大、哈希次数与预计元素数匹配越好，误报通常越低，但内存和 CPU 成本随之增加。标准 Bloom filter 支持插入和查询，不支持删除，因为多个元素可能设置同一位；计数 Bloom filter 用计数器替代单个位，允许近似删除，但内存开销和计数器溢出风险更高。[S1][S2]
:::

:::en
The filter hashes each key and updates several bits. It stores neither the original keys nor enough information to reconstruct the set. A query recomputes the same positions and returns either definite absence or possible presence. A larger bit array and a hash count matched to the expected number of elements generally reduce false positives, at the cost of more memory and CPU. A standard Bloom filter supports insertion and lookup but not deletion, because multiple keys can set the same bit. A counting Bloom filter replaces bits with counters to permit approximate deletion, but uses more memory and risks counter overflow. [S1][S2]
:::

:::zh
若系统事先知道预计插入数量和允许误报率，就能先估算位数组预算，再选择哈希次数，而不是运行到过滤器饱和才补救。不同应用对误报的成本不同：额外读取可能便宜，额外网络调用则可能昂贵，因此参数应从端到端代价推导。
:::

:::en
When expected insert count and tolerated false-positive rate are known, the bit-array budget and hash count can be estimated before deployment instead of reacting after saturation. False positives have different costs in different systems: an extra local read may be cheap, while an extra network request may be expensive. Parameters should follow the end-to-end cost model.
:::

## 一个例子 | A worked example

:::zh
分布式缓存客户端准备读取一个远端键值库。先查询本地 Bloom filter：若结果为不存在，可直接返回缓存未命中而不产生网络请求；若可能存在，再向远端读取并验证真实值。误报只会带来一次额外远程读取，不影响正确性；漏报则会错误跳过实际存在的键，因此过滤器初始化和更新必须与数据写入保持正确关系。重建过程中可先构建新过滤器，再原子切换，避免空过滤器漏掉已有数据。
:::

:::en
A distributed-cache client is about to query a remote key-value store. It first checks a local Bloom filter. If the result is absent, it can return a cache miss without a network request. If the key may be present, it queries the remote store and checks the actual value. A false positive costs an unnecessary remote read but does not change correctness. A false negative would incorrectly skip an existing key, so initialization and updates must stay consistent with writes. During rebuild, constructing a new filter before switching atomically avoids missing existing data with an empty filter.
:::

## 局限与误解 | Limits and misconceptions

:::zh
“可能存在”绝不等于“保证存在”，因此过滤器不能单独作为授权、唯一性或账务判断依据。标准结构会在容量超出设计值后迅速增加误报，动态扩容或分层过滤需要额外策略。哈希种子和输入若可被攻击者控制，也可能遭遇针对性碰撞或资源消耗。过滤器的删除、并发更新、持久化和版本切换需由实现处理。评估时应根据目标误报率与预计插入量计算内存预算，并用真实负载测量，而不是只看理论公式。[S1][S2]
:::

:::en
“Possibly present” never means “guaranteed present,” so a filter must not be the sole basis for authorization, uniqueness, or financial decisions. A standard filter's false-positive rate rises rapidly after its designed capacity is exceeded; scaling or layering needs an explicit strategy. If attackers control hashes or inputs, targeted collisions or resource exhaustion may also matter. Deletion, concurrent updates, persistence, and version switching are implementation concerns. Estimate memory from the target false-positive rate and expected insert count, then measure with realistic load instead of relying on the formula alone. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据结构](/entries/data-structures)比较精确成员集合的实现方式；[信息检索](/entries/information-retrieval)说明过滤器如何帮助跳过不可能匹配的文档；[数据库](/entries/databases)介绍过滤器与持久索引的职责边界。
:::

:::en
[Data Structures](/entries/data-structures) compares exact membership structures. [Information Retrieval](/entries/information-retrieval) shows how a filter can skip documents that cannot match. [Databases](/entries/databases) clarifies the boundary between a filter and a persistent index.
:::

## 参考资料 | References

:::zh
- [S1] Google Guava，`BloomFilter` Java API 与实现注释：成员语义、误报概率和容量估计。[源代码](https://raw.githubusercontent.com/google/guava/master/guava/src/com/google/common/hash/BloomFilter.java)
- [S2] Redis Documentation，Bloom filter 数据类型及容量、误报参数。[官方文档](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)
:::

:::en
- [S1] Google Guava, `BloomFilter` Java API and implementation notes: membership semantics, false-positive probability, and capacity estimation. [Source code](https://raw.githubusercontent.com/google/guava/master/guava/src/com/google/common/hash/BloomFilter.java)
- [S2] Redis Documentation, Bloom filter data type, capacity, and false-positive parameters. [Official documentation](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)
:::
