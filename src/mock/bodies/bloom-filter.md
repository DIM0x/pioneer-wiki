:::zh
**布隆过滤器**由一个长度为 $m$ 的位数组和 $k$ 个哈希函数组成。插入元素时，把它的 $k$ 个哈希位置置 1；查询时，只要有一位为 0，元素就一定不在集合中。
:::

:::en
A **Bloom filter** is a bit array of length $m$ plus $k$ hash functions. Inserting an element sets its $k$ hashed positions to 1; a lookup that finds any of them at 0 proves the element is absent.
:::

## 误报率 | False-positive rate

:::zh
插入 $n$ 个元素后，误报率约为（草稿：公式待审校）：
:::

:::en
After inserting $n$ elements the false-positive rate is about (draft — formula awaiting review):
:::

$$
p \approx \left(1 - e^{-kn/m}\right)^k
$$

:::zh
TODO：补充最优 $k$ 的推导与计数布隆过滤器。
:::

:::en
TODO: derive the optimal $k$ and add counting Bloom filters.
:::
