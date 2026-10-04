:::zh
**L 系统**由一个字母表、一个初始串（公理）和一组重写规则组成。与形式文法的逐个替换不同，L 系统在每一代**同时**替换串中所有符号，就像植物所有的芽同时生长。
:::

:::en
An **L-system** has an alphabet, a starting string (the axiom) and a set of rewriting rules. Unlike a formal grammar, which rewrites one symbol at a time, it rewrites **every** symbol at once each generation — as all the buds of a plant grow together.
:::

## 一株蕨 | A fern

```text
axiom:  X
X → F+[[X]-X]-F[-FX]+X
F → FF
angle:  25°
```

:::zh
用“海龟”解释结果：`F` 向前画一段，`+`/`-` 转向，`[` 保存当前状态，`]` 恢复。迭代五六代，就能长出相当逼真的蕨叶。
:::

:::en
Interpret the result with a turtle: `F` draws forward, `+`/`-` turn, `[` pushes the current state and `]` pops it. Five or six generations grow a convincing fern.
:::

## 长度的增长 | How length grows

:::zh
若每代每个符号平均被替换成 $r$ 个符号，第 $g$ 代的串长约为 $r^g$——这也是为什么渲染时通常只迭代有限几代。
:::

:::en
If each symbol becomes $r$ symbols on average, generation $g$ has length about $r^g$ — which is why renderers iterate only a handful of generations.
:::
