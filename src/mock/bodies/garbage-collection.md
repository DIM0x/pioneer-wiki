:::zh
**垃圾回收**（garbage collection，GC）是运行时自动回收不再使用的内存的机制。它不追问“程序以后还会不会用到这个对象”——这个问题不可判定——而是追问一个可以回答的近似问题：**从根出发，这个对象还可达吗？**
:::

:::en
**Garbage collection** (GC) is how a runtime reclaims memory that is no longer in use. It does not ask whether the program will ever use an object again — that is undecidable — but an answerable approximation: **is the object still reachable from the roots?**
:::

## 可达性 | Reachability

:::zh
根包括栈上的局部变量、寄存器与全局变量。从根沿指针能走到的对象都是“活的”，其余都可以回收。McCarthy 在 1960 年为 Lisp 描述了第一个这样的回收器。
:::

:::en
Roots are local variables on the stack, registers and globals. Every object reachable from a root by following pointers is live; everything else can be reclaimed. McCarthy described the first such collector for Lisp in 1960.
:::

## 标记—清除 | Mark–sweep

:::zh
1. **标记**：从根出发遍历对象图，给每个到达的对象打上标记。
2. **清除**：线性扫描整个堆，把未标记的对象放回空闲链表。
:::

:::en
1. **Mark** — traverse the object graph from the roots and flag every object reached.
2. **Sweep** — scan the whole heap linearly and return unflagged objects to the free list.
:::
<!-- @since 2 -->

## 分代假说 | The generational hypothesis

:::zh
大多数对象朝生暮死。把堆分为新生代与老年代，频繁而廉价地回收新生代，偶尔才回收老年代，就能把大部分工作集中在死亡率最高的区域。
:::

:::en
Most objects die young. Split the heap into a young and an old generation, collect the young one often and cheaply and the old one rarely, and most of the work lands where the death rate is highest.
:::

## 三色标记 | Tri-colour marking

:::zh
并发回收器把对象分为白（未访问）、灰（已访问、子节点未扫描）、黑（已完成）三色。只要始终保持“黑色对象不直接指向白色对象”，回收器就能与程序同时运行；写屏障负责维护这一不变式。
:::

:::en
Concurrent collectors colour objects white (unvisited), grey (visited, children pending) and black (done). As long as no black object points directly at a white one, the collector can run alongside the program; a write barrier maintains that invariant.
:::

```go
// Dijkstra-style insertion barrier: shade the new target before the store.
func writePointer(slot **Object, ptr *Object) {
	shade(ptr) // white → grey
	*slot = ptr
}
```
<!-- @end -->
<!-- @since 3 -->

## 停顿与吞吐 | Pauses and throughput

:::zh
停顿时间大致与需要同步处理的根集与存活集合成正比：
:::

:::en
Pause time is roughly proportional to the roots and live data that must be handled synchronously:
:::

$$
t_{\text{pause}} \approx \frac{|R| + |L_{\text{sync}}|}{v_{\text{mark}}}
$$

| 回收器 Collector | 停顿 Pause | 吞吐 Throughput | 额外开销 Overhead |
| --- | --- | --- | --- |
| 标记—清除 Mark–sweep | 长 Long | 高 High | 碎片 Fragmentation |
| 复制 Copying | 中 Medium | 高 High | 一半堆空间 Half the heap |
| 分代 Generational | 短（新生代）Short (young) | 高 High | 记忆集 Remembered sets |
| 并发 Concurrent | 很短 Very short | 中 Medium | 写屏障 Write barriers |
<!-- @end -->

> 田野笔记：森林里没有清洁工，只有分解者。它们不清点哪些树会被需要，只拆解已经倒下、不再与任何活物相连的木头。
>
> Field note: a forest has no cleaners, only decomposers. They never decide which trees will be needed; they take apart only the wood that has fallen and is joined to nothing alive.
