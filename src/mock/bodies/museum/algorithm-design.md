:::zh
**算法设计：步骤、正确性与复杂度**讨论的不是某种特定代码技巧，而是如何把问题描述转成一套有限、可执行、可检查的步骤。本文在策展分类中对应 **Vanessa cardui**（Vanessa 属）；这是目录配对，不表示蝴蝶行为与算法机制之间存在因果联系。

## 定义与边界 | Definition and boundaries

算法是对一类输入进行有限步骤处理、并产生符合要求输出的明确程序。设计从问题契约开始：哪些输入合法，必须返回什么，允许多少时间与空间，哪些边界情况不能忽略。若契约含糊，“正确”就无从判断。算法设计要决定状态如何表示、每一步采取什么选择，以及为什么这些选择能导向目标；实现则把这套描述写成具体语言和数据结构。两者相关，却不相同：程序能运行，不代表算法满足规格。[Princeton 教材](https://algs4.cs.princeton.edu/14analysis/)把算法分析与可复现测量、数学模型和明确的基本操作联系起来；NIST 的[二分查找条目](https://xlinux.nist.gov/dads/HTML/binarySearch.html)则把算法的前提和每次缩小区间的动作写得很具体。

## 工作机制 | How it works

一种稳妥的设计顺序是：先用小例子澄清输入与输出，再挑选表示方法；随后写出状态转移或循环步骤，建立正确性理由，最后估算资源并用测试检查实现。证明常依赖不变量：初始化时它成立，每次更新仍成立，结束条件与不变量合起来推出结果。复杂度分析则先说清成本模型，例如比较次数、数组访问次数或额外存储，再研究输入规模增大时成本怎样增长。渐近阶便于比较增长速度，却不是机器上的精确秒数；[教材的分析章节](https://algs4.cs.princeton.edu/14analysis/)特别区分了测量、数学模型与基本操作成本，三者可以互相校验，不能相互替代。

## 一个例子 | A worked example

在已排序数组中找数，可采用二分查找。对数组 `[2, 5, 9, 12, 17, 21]` 查找 17，先检查中间位置 2，值为 9，于是丢弃左半段；再检查位置 4，找到 17。核心不变量是：若目标存在，它仍位于当前闭区间内。每次比较至少把候选区间缩小一半，因此最坏比较次数随数组长度按对数增长；NIST 词条将其界定为对有序数组反复二分，并给出对数运行时间。[Princeton 的实现](https://algs4.cs.princeton.edu/11model/BinarySearch.java.html)采用 `lo + (hi - lo) / 2` 计算中点，避免两个大下标相加造成整数溢出。这个例子也暴露出前置条件：若数组未排序，区间淘汰就没有依据。

## 局限与误解 | Limits and misconceptions

渐近复杂度不能独自决定实际选择。常数、内存访问模式、输入分布、数据规模、并行开销以及实现语言都会影响表现；小数据上更简单的线性扫描可能更快。最坏情况、平均情况和摊还分析回答的是不同问题，使用时要说明假设。正确性证明同样依赖规格和模型：若忽略整数溢出、空输入或重复值，证明的对象可能不是实际程序。性能实验应记录硬件、输入、编译选项和测量方法，并可重复；一次计时不能推出普遍规律。最后，复杂问题可能没有已知高效精确算法，此时近似、随机化或启发式方案要明确目标质量、成本和失败概率，而不能把“找到可行解”写成“已证明最优”。

## 相关标本 | Related specimens

[有限自动机](/entries/finite-automata)展示如何把识别任务转成状态转移；[程序不变量与形式验证](/entries/program-invariants)进一步说明怎样论证步骤保持规格；[编译器](/entries/compiler)则展示算法如何经中间表示与目标代码落到工程系统中。
:::

:::en
**Algorithm Design: Steps, Correctness and Complexity** is about turning a problem statement into a finite, executable, inspectable procedure, rather than choosing a clever coding trick. Its curatorial catalogue pairing is **Vanessa cardui** in the genus *Vanessa*. That assignment is organizational only; it asserts no causal relationship between butterfly biology and algorithmic mechanisms.

## 定义与边界 | Definition and boundaries

An algorithm is a precise procedure that processes inputs from a stated domain in finitely many steps and produces outputs that meet a specification. Design therefore starts with a contract: which inputs are valid, what result must be returned, how much time and space are available, and which boundary cases matter. Without such a contract, correctness has no stable meaning. The design chooses a representation, the state needed to solve the task, and the decisions that move that state toward a result. Implementation translates those choices into a programming language and concrete data structures. The two are related but not identical: a program may run while still violating its specification. Princeton’s [analysis chapter](https://algs4.cs.princeton.edu/14analysis/) connects algorithm study with reproducible observations, mathematical models, and explicit cost models. NIST’s entry on [binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html) illustrates how a precondition and a sequence of narrowing decisions make a method precise.

## 工作机制 | How it works

A useful workflow is to clarify inputs and outputs with small examples, choose a representation, state the steps or state transitions, justify correctness, estimate resource use, and then test the implementation. Correctness arguments often use an invariant: it holds initially, each update preserves it, and the invariant combined with the stopping condition implies the requested result. Complexity analysis begins by naming a cost model, such as comparisons, array accesses, or additional storage, and then asks how that cost grows with input size. An asymptotic class helps compare growth rates, but it is not an exact prediction of elapsed seconds. Princeton’s chapter separates measurement, mathematical modeling, and the cost assigned to primitive operations. They can corroborate one another, but one does not replace the others.

## 一个例子 | A worked example

Suppose an ascending array is `[2, 5, 9, 12, 17, 21]` and the target is 17. Binary search checks the middle position, index 2, and sees 9. It can discard the lower half, then checks index 4 and finds 17. The key invariant is that, if the target is present, it remains inside the current closed interval. Each comparison removes at least half of the candidates, so the worst-case number of comparisons grows logarithmically with array length. NIST defines the method as repeatedly halving an interval in a sorted array and gives logarithmic running time. Princeton’s [implementation](https://algs4.cs.princeton.edu/11model/BinarySearch.java.html) computes the midpoint as `lo + (hi - lo) / 2`, avoiding overflow from adding two large indices. The example also exposes the precondition: if the array is not sorted, discarding an interval is unjustified.

## 局限与误解 | Limits and misconceptions

Asymptotic complexity alone does not choose the best implementation. Constant factors, memory locality, input distribution, problem size, parallel overhead, and language runtime all affect observed performance; for small inputs, a simpler linear scan may be faster. Worst-case, average-case, and amortized analyses answer different questions and rely on different assumptions. A correctness proof also depends on its specification and machine model. If the implementation can overflow integers, accept an empty input, or encounter duplicate values, those cases must appear in the reasoning. Performance experiments should record hardware, input data, compiler settings, and measurement procedure so another person can repeat them. One timing is not a universal law. Some difficult problems have no known efficient exact algorithm. Approximation, randomization, and heuristics may be appropriate, but their solution quality, computational cost, and failure probability must be stated; finding a feasible answer is not the same as proving it optimal.

## 相关标本 | Related specimens

[Finite Automata](/entries/finite-automata) shows how recognition can be represented as state transitions. [Program Invariants and Formal Verification](/entries/program-invariants) develops a way to justify that steps preserve a specification. [Compilers](/entries/compiler) shows how algorithms pass through intermediate representations into an engineered system.
:::
