:::zh
**B 树**是一种自平衡的多路搜索树。每个节点存放许多有序的键与子指针，大小通常恰好等于一个磁盘页。节点宽，树就矮：十亿个键的 B 树往往只有三到四层。
:::

:::en
A **B-tree** is a self-balancing multiway search tree. Each node holds many sorted keys and child pointers and is usually exactly one disk page. Wide nodes make a shallow tree: a billion keys often fit in three or four levels.
:::

## 性质 | Invariants

:::zh
- 所有叶子在同一深度。
- 除根以外，每个节点至少半满。
- 节点内的键有序，子树按键区间划分。
:::

:::en
- All leaves are at the same depth.
- Every node except the root is at least half full.
- Keys inside a node are sorted, and subtrees partition the key range between them.
:::

## 分裂 | Splitting

:::zh
向满节点插入时，把它从中间一分为二，中位键上移到父节点；若父节点也满，则继续向上分裂。树只会从根部长高，因此始终平衡。
:::

:::en
Inserting into a full node splits it in two and moves the median key up into the parent; if the parent is full too, the split continues upwards. The tree only grows taller at the root, so it stays balanced.
:::

$$
h \le \log_{\lceil m/2 \rceil} \frac{n + 1}{2}
$$
