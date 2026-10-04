:::zh
**流言协议**（gossip protocol，又称流行病协议）让集群中的每个节点周期性地随机挑选少数同伴交换状态。没有中心协调者，信息却能像流行病一样扩散到整个集群；任何单个节点失效，都不会阻断传播。
:::

:::en
A **gossip protocol** (also *epidemic protocol*) has every node in a cluster periodically pick a few random peers and exchange state with them. There is no coordinator, yet information spreads through the cluster like an epidemic, and no single failed node can stop it.
:::

## 推、拉与推拉 | Push, pull and push–pull

:::zh
- **推**：知道新消息的节点把它发给随机同伴。
- **拉**：节点向随机同伴询问是否有新消息。
- **推拉**：双方交换摘要，各自补齐对方缺失的部分。
:::

:::en
- **Push** — a node that knows an update sends it to a random peer.
- **Pull** — a node asks a random peer for anything new.
- **Push–pull** — both sides exchange digests and fill in what the other is missing.
:::

<!-- @since 2 -->
## 收敛速度 | How fast it converges

:::zh
每一轮里，已知消息的节点数量大致翻倍，因此覆盖 $n$ 个节点所需的轮数只随 $\log n$ 增长：
:::

:::en
Each round roughly doubles the number of nodes that know an update, so the rounds needed to reach $n$ nodes grow only with $\log n$:
:::
<!-- @end -->
<!-- @in 2-3 -->

$$
T \approx \log_2 n
$$
<!-- @end -->
<!-- @since 4 -->

$$
T_{\text{push}} \approx \log_2 n + \ln n, \qquad T_{\text{push–pull}} \approx \log_3 n + O(\log \log n)
$$

:::zh
纯推送在末期效率很低：剩下的少数节点很难被随机选中，这正是多出来的 $\ln n$ 项[^pittel]。推拉结合则在后期由“未知者主动去拉”补上这一段[^karp]。
:::

:::en
Pure push slows down at the end: the last few uninformed nodes are rarely picked at random, which is where the extra $\ln n$ comes from[^pittel]. Push–pull closes that tail because the uninformed nodes go and ask[^karp].
:::
<!-- @end -->
<!-- @since 2 -->

## 散布谣言 | Rumour mongering

:::zh
“热”消息被反复转发，直到节点多次遇到已经知道它的同伴，便对它“失去兴趣”而停止转发。代价很低，但少数节点可能始终没有收到。
:::

:::en
A “hot” update is forwarded again and again until a node keeps meeting peers who already know it and loses interest. It is cheap, but a few nodes may never hear it.
:::
<!-- @end -->
<!-- @since 3 -->

## 反熵 | Anti-entropy

:::zh
反熵是兜底机制：节点定期与随机同伴完整比对数据（通常借助默克尔树缩小比对范围），保证最终一致。Demers 等人在 Xerox 的数据库复制中把两者组合使用：谣言负责快，反熵负责全。
:::

:::en
Anti-entropy is the safety net: nodes periodically reconcile their full state with a random peer (often narrowing the comparison with a Merkle tree), which guarantees eventual consistency. Demers et al. combined both for database replication at Xerox: rumours for speed, anti-entropy for completeness.
:::

```python
import random

def gossip_round(node, peers, fanout=3):
    """One push–pull round: swap digests, then send each side what it lacks."""
    for peer in random.sample(peers, k=min(fanout, len(peers))):
        mine, theirs = node.digest(), peer.digest()
        node.apply(peer.updates_since(mine))
        peer.apply(node.updates_since(theirs))
```
<!-- @end -->
<!-- @since 4 -->

## 三种方式的对照 | The three styles compared

| 方式 Style | 每轮消息 Messages / round | 后期效率 Tail behaviour | 适合 Best for |
| --- | --- | --- | --- |
| 推 Push | $n$ | 慢 Slow | 新消息很少 Rare updates |
| 拉 Pull | $n$ | 快 Fast | 新消息频繁 Frequent updates |
| 推拉 Push–pull | $2n$ | 最快 Fastest | 成员表、元数据 Membership, metadata |
<!-- @end -->

> 田野笔记：把一滴墨滴进湿纸，墨迹不会沿着预先画好的线走，却总能洇满整页。
>
> Field note: drop ink on wet paper and it follows no ruled line, yet it always reaches the edges.
<!-- @since 4 -->

[^pittel]: B. Pittel, “On Spreading a Rumor”, *SIAM Journal on Applied Mathematics*, 1987.
[^karp]: R. Karp, C. Schindelhauer, S. Shenker, B. Vöcking, “Randomized Rumor Spreading”, *FOCS*, 2000.
<!-- @end -->
