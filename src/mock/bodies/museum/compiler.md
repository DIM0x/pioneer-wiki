:::zh
**编译器：从源代码到执行形式**解释程序如何经过若干表示转换，成为目标平台可以执行的代码。编译不是简单的逐词翻译：每个阶段都会建立并检查关于程序结构或含义的事实。目录将本文配对至 **Heliconius melpomene**（Heliconius 属），这是策展映射，不表示技术管线对应任何真实生物过程。

## 定义与边界 | Definition and boundaries

编译器接收一种语言的程序，并依照该语言和目标平台的规则，生成另一种形式，例如机器码、字节码或中间表示。一个典型前端先进行词法分析，将字符组成标识符、关键字和运算符等 token；语法分析按文法建立抽象语法树；语义分析检查名字绑定、类型及作用域等规则。[Cornell 编译课程导论](https://www.cs.cornell.edu/courses/cs4120/2026sp/notes/intro/)将这些阶段列为前端工作，并强调精确描述有助于确定实现目标。通过这些检查，程序才被视为符合源语言的形式规则；这仍不等于程序逻辑满足用户意图。

## 工作机制 | How it works

前端通常生成抽象语法树或更低层的中间表示（IR）。IR 把源语言细节与目标机器细节隔开，并提供便于分析和优化的操作。IR 可以有多个层次：较高层保留循环、函数等结构，较低层更贴近指令。优化阶段可能进行常量折叠、死代码消除或公共子表达式处理，但每项变换都必须在语言语义允许的范围内保持可观察行为。[Cornell 的 IR 讲义](https://www.cs.cornell.edu/courses/cs4120/2023sp/notes/ir/)指出，源 AST 和汇编都可能不适合直接做优化，因此编译器设计中常引入更易分析的表示。后端再进行指令选择、寄存器分配和代码发射；LLVM 教程则展示了从 Kaleidoscope AST 生成 LLVM IR、接入优化器，并最终发射目标对象文件的实际步骤。

## 一个例子 | A worked example

考虑表达式 `x = 2 + 3 * 4`。语法树必须把乘法放在加法之下，表达式为 `2 + (3 * 4)`；若实现把运算顺序弄反，就已改变程序意义。语义分析会检查 `x` 是否已声明以及这些值是否类型兼容。编译器若确认常量运算遵守该语言的整数规则，可以把右侧折叠为 14，再写入 IR。之后，后端可能把值装入寄存器并生成目标指令。此例里，优化前后结果相同，且计算无需运行时乘加；但若整数溢出、浮点舍入、异常或副作用可能被观察到，就不能不加条件地做同一变换。一个有用的编译器解释必须同时回答“生成了什么”和“为什么语义得以保留”。

## 局限与误解 | Limits and misconceptions

编译成功只说明源程序通过了编译器实现的检查，并生成了目标形式；它不能证明算法正确、输入可信或系统安全。编译器自身可能有缺陷，目标架构也有指令、内存模型和 ABI 限制。优化效果受工作负载、编译参数和硬件影响，编译器不能保证每段代码都更快。IR 不是天然与所有语言和机器完全无关；它的类型、控制流和内存语义会限制能表达或合法优化的内容。源级调试、异常栈和性能剖析还需要把优化后指令映射回源位置。实际工程常结合编译器测试、差分测试、验证工具和目标机测量，而不是把“使用成熟编译器”当作正确性证明。

## 相关标本 | Related specimens

[有限自动机](/entries/finite-automata)解释词法扫描所用的状态模型；[程序不变量与形式验证](/entries/program-invariants)讨论如何表达程序行为保证；[算法设计](/entries/algorithm-design)帮助区分算法本身的成本与编译器生成代码的成本。
:::

:::en
**Compilers: From Source Code to Executable Form** explains how a program passes through a sequence of representations before a target platform can execute it. Compilation is more than word-for-word translation: each phase establishes and checks facts about program structure or meaning. The catalogue pairs this entry with **Heliconius melpomene** in genus *Heliconius*. That is a curatorial mapping and does not imply that a compiler pipeline corresponds to a biological process.

## 定义与边界 | Definition and boundaries

A compiler accepts a program in one language and, under the rules of that language and a target platform, produces another form such as machine code, bytecode, or an intermediate representation. A typical front end begins with lexical analysis, which groups characters into tokens such as identifiers, keywords, and operators. Parsing organizes tokens according to a grammar into an abstract syntax tree. Semantic analysis then checks rules such as name binding, types, and scope. The [introduction to Cornell’s compiler course](https://www.cs.cornell.edu/courses/cs4120/2026sp/notes/intro/) lists these as front-end phases and explains why precise descriptions help define an implementation target. Passing these checks makes the source program well formed according to the implemented language rules; it does not establish that the program meets a user’s intent.

## 工作机制 | How it works

The front end typically produces an abstract syntax tree or a lower-level intermediate representation (IR). IR separates many source-language details from target-machine details and provides operations that are easier to analyze and optimize. A compiler may use several IR levels: a higher-level one can retain loops and functions, while a lower-level one approaches machine instructions. Optimization may include constant folding, dead-code elimination, or common-subexpression handling, but each transformation must preserve observable behaviour under the language’s semantics. [Cornell’s IR notes](https://www.cs.cornell.edu/courses/cs4120/2023sp/notes/ir/) explain that neither a source AST nor assembly is necessarily convenient for direct optimization, motivating a representation better suited to analysis. A back end then selects instructions, allocates registers, and emits code. The LLVM tutorial walks through generating LLVM IR from the Kaleidoscope AST, connecting an optimizer, and eventually emitting a target object file.

## 一个例子 | A worked example

Consider `x = 2 + 3 * 4`. The syntax tree must place multiplication below addition, representing `2 + (3 * 4)`; reversing the precedence changes the program’s meaning. Semantic analysis checks that `x` is declared and that the values have compatible types. If the compiler can establish that constant evaluation follows the language’s integer rules, it may fold the right-hand side to 14 and record the assignment in IR. The back end may then load the value into a register and emit a target instruction. In this example, the optimized and unoptimized forms agree, and the multiplication and addition need not run at execution time. The same transformation is not automatically valid when integer overflow, floating-point rounding, exceptions, or side effects are observable. A sound explanation of compilation must answer both what was generated and why the transformation preserves the program’s meaning.

## 局限与误解 | Limits and misconceptions

Successful compilation means that the source passed the checks implemented by the compiler and that a target form was emitted. It does not prove that the algorithm is correct, input is trustworthy, or the resulting system is secure. Compilers can contain bugs, and targets impose instruction-set, memory-model, and ABI constraints. Optimization depends on workload, flags, and hardware; a compiler cannot promise that every program will become faster. An IR is not inherently independent of every language and machine: its types, control-flow model, and memory semantics constrain what it can express and which transformations are valid. Source-level debugging, exception traces, and profiling also need mappings from optimized instructions back to source locations. Production practice combines compiler testing, differential testing, verification tools where appropriate, and measurement on the target system; using a mature compiler is not itself a correctness proof.

## 相关标本 | Related specimens

[Finite Automata](/entries/finite-automata) explains the state models used in lexical scanning. [Program Invariants and Formal Verification](/entries/program-invariants) describes how to state behavioural guarantees. [Algorithm Design](/entries/algorithm-design) helps distinguish the cost of an algorithm from the cost of its generated code.
:::
