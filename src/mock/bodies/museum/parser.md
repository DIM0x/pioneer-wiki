:::zh
**语法分析器**把输入按照文法组织成结构，供解释器、编译器或其他程序继续处理。典型工具链先把文本拆成词法单元，再识别表达式、声明和语句。解析不等于执行：一棵语法树不保证变量存在、类型匹配或操作安全。[1]

## 定义与边界 | Definition and boundaries

文法描述合法结构，解析器实现识别或构造这些结构的过程。具体语法树可以保留括号、分隔符和注释；抽象语法树通常省略表面符号，留下后续计算需要的节点。例如加法节点保存左右操作数，不必把每个空格也存进树里。格式化工具与编译器对细节的需求不同，不能把一种树结构当成所有解析器的唯一输出。[1]

解析器必须明确输入边界。读到合法表达式后，如果剩余词法单元无人处理，整个输入仍可能不合法。语法正确也不能代替名称解析、类型检查与外部数据校验；成功读取配置文件，只能说明它满足解析器负责的结构约束。

## 工作机制 | How it works

递归下降为不同文法层次编写相互调用的函数。函数查看当前词法单元，选择分支，消耗输入，再返回节点。操作符优先级可以用不同文法层次表达，也可以用优先级驱动的递归处理。LLVM 的教学语言结合递归下降与运算符优先级解析，分别处理基本结构与二元表达式。[1]

考虑 `expression → term (("+" | "-") term)*` 和 `term → factor (("*" | "/") factor)*`。表达式函数先调用项函数，项函数先调用因子函数；乘法在较低层先被组织起来，因此优先级高于加法。循环不断更新左侧节点，可以表达减法的左结合性。把所有运算符放进没有约束的递归规则，可能产生多种语法树；解决歧义需要明确优先级和结合性，不能只选一次成功解析。[2]

## 一个例子 | A worked example

输入 `2 + 3 * 4` 时，解析器先构造 `3 * 4` 的乘法节点，再把它作为加法的右子节点，求值结果为十四。输入改成 `(2 + 3) * 4` 时，括号让加法成为因子，树的根变成乘法，结果为二十。区别来自结构，不是求值器对同一棵树临时改变计算顺序。

错误输入 `2 + * 4` 在期待因子的地方出现乘号。诊断应记录位置、实际词法单元和预期结构，避免一次局部错误扩散成大量误导消息。编辑器可以恢复后继续解析，但要区分完整树与包含错误节点的恢复结果；不能把恢复后的树误报为源程序完全合法。

## 局限与误解 | Limits and misconceptions

递归下降便于手写，但直接左递归的规则不能原样交给朴素实现，否则会在消耗输入前反复调用自身。回溯也不自动保证线性复杂度，成本取决于文法、算法、缓存与输入。面对不可信文件，应限制输入长度、嵌套深度和资源使用。批处理编译器与交互式编辑器需要的错误恢复策略可能不同。[2]

本条目的策展物种是犬蔷薇 *Rosa canina*。枝、叶、花提供结构观察的视觉线索，不意味着植物真实执行文法解析。物种分类与技术机制分别核验。

## 相关标本 | Related specimens

与[编程语言](/entries/programming-languages)、[编译器](/entries/compiler)和[有限自动机](/entries/finite-automata)一起阅读，区分语言规则、处理阶段与识别模型。

## 参考资料 | References

1. [LLVM: Implementing a Parser and AST](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl02.html)
2. [Robert Nystrom: Parsing Expressions](https://craftinginterpreters.com/parsing-expressions.html)
:::

:::en
A **parser** organizes input according to a grammar so that an interpreter, compiler, or another program can process it. A typical toolchain first breaks text into tokens, then recognizes expressions, declarations, and statements. Parsing is different from execution: a syntax tree does not establish that variables exist, types agree, or an operation is safe.[1]

## 定义与边界 | Definition and boundaries

A grammar describes legal structures. A parser implements recognition or construction of those structures. A concrete syntax tree can retain parentheses, separators, and comments, while an abstract syntax tree generally removes surface details and retains nodes needed for later computation. An addition node, for example, stores its operands without necessarily storing every space in the source. Formatters and compilers need different levels of detail; one tree representation is not the universal output of every parser.[1]

The parser must also define the input boundary. Recognizing one valid expression does not make the whole input valid if extra tokens remain. Syntactic correctness does not replace name resolution, type checking, or validation of external data. Successfully reading a configuration only establishes the structural constraints that its parser is responsible for checking.

## 工作机制 | How it works

Recursive descent assigns mutually calling functions to grammar levels. Each function inspects the current token, chooses a branch, consumes input, and returns a node. Operator precedence can be represented by separate grammar levels or handled through precedence-guided recursion. LLVM's tutorial language combines recursive descent for basic constructs with operator-precedence parsing for binary expressions.[1]

Consider `expression → term (("+" | "-") term)*` and `term → factor (("*" | "/") factor)*`. The expression function calls the term function, which calls the factor function. Multiplication is organized at the lower level before addition, giving it higher precedence. A loop that repeatedly updates the left node expresses left associativity for subtraction. Putting every operator into an unconstrained recursive rule can produce several syntax trees. Resolving ambiguity requires explicit precedence and associativity, rather than accepting an arbitrary successful interpretation.[2]

## 一个例子 | A worked example

For `2 + 3 * 4`, the parser first builds a multiplication node for `3 * 4`, then makes that node the right operand of addition. An evaluator subsequently obtains fourteen. In `(2 + 3) * 4`, parentheses make addition a factor, the root becomes multiplication, and evaluation produces twenty. The distinction comes from tree structure, not from an evaluator improvising a different execution order for the same tree.

For the erroneous input `2 + * 4`, multiplication appears where a factor is expected. A useful diagnostic records the position, actual token, and expected structure, while avoiding many misleading errors caused by one local failure. An editor can recover and continue parsing, but must distinguish a complete tree from a recovered tree containing error nodes. Such recovery does not prove that the original program is entirely valid.

## 局限与误解 | Limits and misconceptions

Recursive descent is convenient to write by hand, but a directly left-recursive rule cannot be copied into a naive implementation: it recurses before consuming input. Backtracking does not automatically guarantee linear time either; cost depends on the grammar, algorithm, memoization, and input. For untrusted files, limit input length, nesting depth, and resource consumption. A batch compiler and a live editor may need different error-recovery strategies.[2]

The curated counterpart is dog rose, *Rosa canina*. Branches, leaves, and flowers provide visual clues for observing structure, not evidence that a plant executes grammar parsing. Biological classification and technical mechanisms are checked separately.

## 相关标本 | Related specimens

Read [Programming Languages](/entries/programming-languages), [Compilers](/entries/compiler), and [Finite Automata](/entries/finite-automata) to distinguish language rules, processing stages, and recognition models.

## 参考资料 | References

1. [LLVM: Implementing a Parser and AST](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl02.html)
2. [Robert Nystrom: Parsing Expressions](https://craftinginterpreters.com/parsing-expressions.html)
:::
