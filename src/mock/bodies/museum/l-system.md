:::zh
**L-System：规则驱动的生成**是一种并行字符串重写模型：给定字母表、公理和产生规则，每一代同时替换所有可替换符号，再把生成的符号解释为几何指令或其他结构。它既是形式语言模型，也可用来构造分枝图形。目录中的策展物种是 **Polygonia c-album**（Polygonia 属）；这个配对不声称该蝶种的发育真实采用文中的算法。

## 定义与边界 | Definition and boundaries

经典确定性、无上下文 L-System（D0L）由符号集合、初始串（公理）和产生规则组成。例如规则 `A → AB` 与 `B → A` 将每个符号映射为一个串。重写一代时，旧串中的每个符号按同一轮规则同步替换；这与通常一次改写一个非终结符的顺序文法不同。《[The Algorithmic Beauty of Plants](https://algorithmicbotany.org/papers/abop/abop.pdf)》解释，L-System 的并行规则来自细胞可能同时分裂的建模动机，同时也讨论无上下文、有上下文和参数化变体。因此，形式规则本身不等于完整植物模型：要表达生长阶段、环境或资源限制，还要增加上下文、参数和控制机制。

## 工作机制 | How it works

生成器从公理开始，重复执行同步替换，直到指定代数或达到预算。若结果要画成图形，可采用“海龟解释”：维护位置与方向，`F` 前进并绘线，`+` 和 `-` 按给定角度转向，`[` 保存位置与方向，`]` 恢复它们，形成分枝。规则选择决定生成语言，解释器决定串如何映射到几何。两者应分开调试：若串正确但图形方向不对，问题可能在解释器；若预期分枝未出现，可能是公理或产生式不合适。迭代长度往往增长很快。若每轮每个符号平均产生 $r$ 个后继，粗略规模按 $r^g$ 增长；实际增长由各符号的规则和频率共同决定。

## 一个例子 | A worked example

令公理为 `F`，规则为 `F → F[+F]F[-F]F`，解释角为 25°。第一代字符串包含五个 `F`：中间主枝继续向前，两组括号分别保存并恢复分枝起点，向左右转出侧枝。再对每个 `F` 同步应用规则后，末端也会长出新枝；括号及转向符号不变。通过增加代数，图形层级变细，但串和绘图工作量迅速扩大。这个例子可以精确复现相同规则生成的结构，却不代表真实树木恰好按该固定角度或统一模板生长。若要模拟不同枝段长度，可加入参数规则；若后继依赖相邻符号，则需使用上下文敏感的 L-System。

## 局限与误解 | Limits and misconceptions

L-System 能生成植物风格图案，不代表它单凭外观便能解释生物发育。真实组织受到时序、局部信号、遗传差异、资源和环境影响，简单规则通常只能捕捉选定尺度或形态特征。参数化和上下文规则增强表现力，也增大参数估计、验证与计算成本。规则系统可能产生组合爆炸、重叠枝条或不合理比例；限制代数、惰性展开、剪枝和空间碰撞检测可管理渲染，却会改变完整生成过程。实际应用应说明规则来源、可观察目标和验证标准，避免把视觉相似误称为机制已被验证。

## 相关标本 | Related specimens

[算法设计](/entries/algorithm-design)解释如何分析重写的计算成本；[有限自动机](/entries/finite-automata)提供识别字符串的状态模型，可与生成模型对照；[对称、几何与结构](/entries/symmetry-geometry-structure)讨论生成图形中不变的几何关系。
:::

:::en
**L-Systems: Rule-driven Generation** are parallel string-rewriting models. Given an alphabet, an axiom, and production rules, each generation replaces all eligible symbols simultaneously; the resulting symbols can then be interpreted as geometric instructions or another structure. L-systems are both formal-language models and a way to construct branching figures. The catalogue’s curatorial species is **Polygonia c-album** in genus *Polygonia*. This pairing does not claim that the butterfly’s development uses the algorithm described here.

## 定义与边界 | Definition and boundaries

A classic deterministic, context-free L-system (D0L-system) consists of an alphabet, an initial string called the axiom, and production rules. For example, `A → AB` and `B → A` map each symbol to a string. During one derivation step, every symbol in the old string is replaced synchronously according to the same rule set. This differs from a conventional sequential grammar, which rewrites one nonterminal at a time. *[The Algorithmic Beauty of Plants](https://algorithmicbotany.org/papers/abop/abop.pdf)* explains that parallel productions were motivated by the possibility of concurrent cell divisions, and also develops context-sensitive and parametric variants. The formal rules alone are not a complete plant model: representing growth stages, environmental effects, or resource limits requires additional context, parameters, or control mechanisms.

## 工作机制 | How it works

The generator begins with the axiom, applies synchronous rewriting, and stops at a chosen generation or resource budget. To draw the result, a turtle interpreter can keep a position and heading: `F` moves forward and draws, `+` and `-` turn by a chosen angle, `[` saves position and heading, and `]` restores them to begin a branch. The production rules determine the generated language; the interpreter determines how a string maps to geometry. Keeping them separate helps debugging: if the string is correct but the drawing faces the wrong way, the interpreter may be at fault; if an expected branch never appears, the axiom or productions may be wrong. Strings can grow rapidly. If each symbol produces an average of `r` successors per generation, a rough scale is `r^g` after `g` generations, although actual size depends on the rules and symbol frequencies.

## 一个例子 | A worked example

Take axiom `F`, rule `F → F[+F]F[-F]F`, and a turning angle of 25 degrees. The first generation contains five `F` commands: a central continuation moves forward, while the bracketed commands save and restore the branch point to draw left and right shoots. Applying the rule synchronously to each `F` adds new branches at the tips; brackets and turns remain unchanged. More generations make the pattern finer but rapidly increase string size and drawing work. The example is exactly reproducible for a fixed rule set, but it does not mean that a real tree grows at that fixed angle or by one uniform template. Parametric rules can vary segment lengths; context-sensitive L-systems allow a symbol’s successor to depend on neighbouring symbols.

## 局限与误解 | Limits and misconceptions

An L-system can produce a plant-like picture without explaining biological development. Real tissues are affected by timing, local signals, genetic variation, resources, and environment; simple rules usually capture selected scales or shape features only. Parametric and context-sensitive rules add expressive power but also increase the cost of parameter estimation, validation, and computation. A rule system may produce combinatorial growth, overlapping branches, or implausible proportions. Limiting generations, lazy expansion, pruning, and spatial collision checks can make rendering manageable, but they alter the full generation process. Applications should state where the rules came from, which observations they aim to reproduce, and how success is judged. Visual similarity alone does not verify a biological mechanism.

## 相关标本 | Related specimens

[Algorithm Design](/entries/algorithm-design) explains how to analyze the cost of rewriting. [Finite Automata](/entries/finite-automata) provides a state model for recognizing strings and contrasts with generation. [Symmetry, Geometry and Structure](/entries/symmetry-geometry-structure) examines geometric relations that can remain invariant in a generated figure.
:::
