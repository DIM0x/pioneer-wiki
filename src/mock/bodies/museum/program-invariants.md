:::zh
**程序不变量与形式验证**把“程序应该这样工作”的直觉写成可推理的断言，并用规则或证明检查实现是否满足它。它特别适合边界条件多、错误代价高或难以穷尽测试的代码。策展目录把本文对应到 **Junonia coenia**（Junonia 属）；此配对不把形式验证与蝴蝶的真实结构或行为建立因果联系。

## 定义与边界 | Definition and boundaries

程序不变量是在程序执行的某个位置始终成立的逻辑性质。循环不变量通常要在每次到达循环头时成立；循环体执行后仍成立，循环终止时它又与退出条件一起推出所需结论。Hoare 三元组 `{P} C {Q}` 表示：若命令 `C` 在满足前置条件 `P` 的状态开始运行，并最终终止，则结束状态满足后置条件 `Q`。因此这是部分正确性陈述，单独不保证程序一定终止。[UPenn《Software Foundations》](https://softwarefoundations.cis.upenn.edu/plf-current/Hoare.html)从小型命令语言定义语义和 Hoare 规则，并明确区分部分正确性与总正确性；[马里兰大学循环不变量讲义](https://www.cs.umd.edu/class/fall2025/cmsc433/Loop_Invariants.html)则把循环不变量与 Dafny 的 decreases 终止度量分开说明。

## 工作机制 | How it works

要证明循环不变量 `I`，通常分三步：初始化，证明执行循环前 `I` 成立；保持性，假设 `I` 与循环条件同时成立，证明执行一次循环体后 `I` 仍成立；退出，利用 `I` 与循环条件为假推出后置条件。若还要证明终止，则另需一个每步严格下降且有下界的量。形式验证可以由纸面证明、类型系统、模型检查器、SMT 求解器或交互式证明助手完成；这些工具的保证范围取决于输入规格、语义模型和工具链本身。验证器证明的是给定模型中的陈述，规格遗漏错误行为时，证明不会自动补上缺失要求。

## 一个例子 | A worked example

计算数组前 `n` 项总和：`sum = 0; i = 0; while i < n: sum += a[i]; i += 1`。若 `n` 不大于数组长度，循环头的不变量可取 `0 ≤ i ≤ n` 且 `sum = Σ(a[j], 0 ≤ j < i)`。初始化时 `i=0`，空前缀之和为 0，所以性质成立。若 `i<n`，加入 `a[i]` 后，`sum` 恰好成为前 `i+1` 项之和，再令 `i` 增一，不变量仍成立。退出时 `i<n` 为假，结合 `i≤n` 得到 `i=n`，于是 `sum` 等于前 `n` 项之和。终止论证可使用自然数度量 `n-i`：每轮减一且不小于零。这个证明还暴露了前置条件的重要性：若 `n` 为负或超出数组长度，表达式 `a[i]` 可能越界，原命题就不适用。

## 局限与误解 | Limits and misconceptions

测试检查选定输入上的执行，形式证明则在明示假设下覆盖模型允许的所有执行；两者回答不同问题，也都依赖正确规格。并发程序可能需要处理调度和内存模型，浮点代码要面对舍入规则，外部服务则需要明确失败与重试语义。证明复杂度可能超过实现本身，工具还可能有不可信的外部求解器或编译链。实际项目通常从关键函数、状态机、边界检查或安全属性开始，逐步提高形式化程度。不要把“存在循环不变量”误当成证明已经完成：它必须足以推出目标，初始化、保持性、退出和终止条件都要逐项核对。

## 相关标本 | Related specimens

[算法设计](/entries/algorithm-design)介绍正确性与成本分析；[有限自动机](/entries/finite-automata)展示可穷举状态模型；[编译器](/entries/compiler)说明程序语义如何经过变换映射到机器形式。
:::

:::en
**Program Invariants and Formal Verification** turns an intuition about how software should behave into assertions that can be reasoned about and checked against an implementation. It is useful for code with subtle boundaries, high failure costs, or too many cases for testing alone to cover. The catalogue pairs this entry with **Junonia coenia** in genus *Junonia*. The pairing does not claim a causal connection between formal verification and the butterfly’s real structure or behaviour.

## 定义与边界 | Definition and boundaries

A program invariant is a logical property that remains true at a chosen point during execution. A loop invariant usually holds whenever control reaches the loop head. It must still hold after the body runs, and when the loop stops it combines with the exit condition to imply the desired conclusion. A Hoare triple, `{P} C {Q}`, says that if command `C` starts in a state satisfying precondition `P` and eventually terminates, its final state satisfies postcondition `Q`. This is a partial-correctness statement; by itself it does not prove termination. [UPenn’s Software Foundations chapter on Hoare Logic](https://softwarefoundations.cis.upenn.edu/plf-current/Hoare.html) defines program semantics and proof rules for a small command language, explicitly distinguishing partial from total correctness. The [University of Maryland notes on loop invariants](https://www.cs.umd.edu/class/fall2025/cmsc433/Loop_Invariants.html) separately discuss invariants and Dafny’s decreases clauses for termination.

## 工作机制 | How it works

A loop-invariant proof commonly has three obligations. Initialization shows that `I` holds before the first iteration. Preservation assumes both `I` and the loop guard, then proves that one execution of the body leaves `I` true. Exit uses `I` together with a false guard to derive the postcondition. To prove termination as well, identify a measure that is bounded below and strictly decreases on every iteration. Formal verification can use a paper proof, type system, model checker, SMT solver, or interactive proof assistant. The guarantee depends on the stated specification, semantic model, and trusted parts of the tool chain. A verifier proves a statement inside that model; if the specification omits an erroneous behaviour, the proof does not add the missing requirement.

## 一个例子 | A worked example

Consider summing the first `n` array elements: `sum = 0; i = 0; while i < n: sum += a[i]; i += 1`. Assuming `n` is no greater than the array length, an invariant at the loop head is `0 ≤ i ≤ n` and `sum = Σ(a[j], 0 ≤ j < i)`. Initially `i=0`, and the empty prefix sums to zero, so the invariant holds. When `i<n`, adding `a[i]` makes `sum` equal to the first `i+1` elements; incrementing `i` restores the invariant for the next iteration. On exit, `i<n` is false. Together with `i≤n`, this gives `i=n`, so `sum` is the requested prefix sum. The natural-number measure `n-i` proves termination because it decreases by one and never falls below zero. The proof also exposes a required precondition: if `n` is negative or exceeds the array length, `a[i]` may be invalid and the claim no longer applies.

## 局限与误解 | Limits and misconceptions

Testing checks executions on selected inputs; formal proof covers all executions permitted by an explicit model and its assumptions. They answer different questions, and both depend on a correct specification. Concurrent programs may require reasoning about scheduling and memory models, floating-point code must account for rounding, and external services need defined failure and retry behaviour. Proof effort can exceed implementation effort, and verification tools may rely on external solvers or compilers that are part of the trusted chain. Projects often begin with critical functions, state machines, bounds checks, or security properties, then raise the level of formalization where the benefit justifies the cost. Merely naming a loop invariant does not finish a proof: it must be strong enough to imply the goal, and initialization, preservation, exit, and termination obligations must each be checked.

## 相关标本 | Related specimens

[Algorithm Design](/entries/algorithm-design) introduces correctness and cost analysis. [Finite Automata](/entries/finite-automata) shows a state model small enough for exhaustive reasoning. [Compilers](/entries/compiler) explains how program semantics are mapped through transformations into machine form.
:::
