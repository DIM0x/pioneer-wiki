:::zh
**编程语言：语法、类型与运行时**介绍开发者如何用精确、可执行的表示描述计算。编程语言不只是关键字集合；它通常包含语法、表达式与语句的含义、类型规则、模块机制，以及把程序变成可执行行为的实现环境。不同语言可以共享类似语法，却对溢出、并发、空值或资源释放给出不同规则。因此，读懂一门语言既要看“代码长什么样”，也要看“这些代码在何种条件下意味着什么”。

## 定义与边界 | Definition and boundaries

语法规定哪些程序文本可以被接受，语义规定它执行时产生什么行为。类型系统则在运行前或运行中，限制值能参与的操作，并把一部分错误提前暴露出来。语言规范描述承诺的行为；编译器、解释器、虚拟机和标准库则提供这些行为的一种实现。语言与框架、库也要区分：语言定义表达能力和基本规则，库提供可复用功能，框架组织应用生命周期和扩展点。

“静态”与“动态”类型描述检查发生的时间和方式，并不直接等于“安全”与“不安全”。同样，编译型与解释型也不是所有实现都能整齐分开的两类；许多运行时会先解释、再编译热点代码，或把源码转换为中间表示后执行。

## 工作机制 | How it works

以常见工具链为例，源代码先经词法和语法分析形成结构化表示，随后进行名称解析、类型检查或其他静态分析。实现可以把它编译成本机指令、字节码，或直接解释表示。运行时负责具体执行，并可能管理内存、异常、线程、模块加载和与操作系统交互。这个过程不是每门语言都采用同一流水线：脚本语言可能在加载模块时即时编译，强类型语言也可能把类型擦除后再运行。

类型带来的保证有明确边界。编译器可以拒绝把字符串当作整数相加，却无法仅凭一个静态类型声明证明外部网络数据真实符合该类型。并发内存模型、浮点运算和未定义行为也会使“代码看起来合理”与“结果被规范保证”之间出现距离。工程上应同时阅读语言规范、实现文档和所用版本的行为说明。

## 一个例子 | A worked example

假设 TypeScript 程序定义 `function greet(name: string) { return "Hi " + name; }`。类型检查器可以在已知调用点传入数字时报告错误；JavaScript 引擎执行输出的 JavaScript，运行时不会保留 TypeScript 的 `string` 类型约束。如果 `name` 来自 JSON，程序仍需在边界处解析并验证数据。把网络对象直接断言为某个 TypeScript 类型，只是在告诉编译器“请相信我”，不是实际检查。这个例子展示了语言工具如何协作，也说明静态检查不能替代输入验证。

## 局限与误解 | Limits and misconceptions

语言特性不是自动生成好软件的配方。更严格的类型可以让部分不一致更早失败，但设计不清、错误的业务假设和资源竞争依然可能存在。相反，动态语言也能通过测试、静态分析和明确接口获得强反馈。性能不能只看语言标签：算法复杂度、内存访问、运行时实现和负载分布经常更重要。初学者也容易把某个编译器版本的行为误当成语言规范；遇到关键边界时应查规范并写最小实验。

## 相关标本 | Related specimens

下一步可阅读[框架与库](/entries/frameworks-libraries)、[浏览器中的界面](/entries/frontend-development)和[API 服务](/entries/backend-services)。[语法分析器](/entries/parser)聚焦源代码如何依照文法形成结构，是语言实现链条中的一个环节。

## 参考资料 | References

- [MDN: JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [ECMAScript Language Specification](https://tc39.es/ecma262/)
:::

:::en
**Programming Languages: Syntax, Types and Runtimes** explains how developers describe computation in precise, executable forms. A programming language is more than a collection of keywords. It has syntax, rules for the meaning of expressions and statements, a type system, module mechanisms, and an implementation environment that turns a program into behavior. Two languages can look similar while defining different rules for overflow, concurrency, null values, or resource release. Learning a language therefore means understanding both what code looks like and what that code is promised to do.

## 定义与边界 | Definition and boundaries

Syntax specifies which source texts are well formed; semantics specifies what a well-formed program means. A type system constrains the operations that may be applied to values and can expose some errors before execution, or during it. A language specification records the behavior that implementations promise. Compilers, interpreters, virtual machines, and standard libraries provide particular implementations of those rules. Keep the language separate from a framework or library: the language defines core expressive rules, a library supplies reusable capabilities, and a framework organizes an application's lifecycle and extension points.

“Static” and “dynamic” typing describe when and how checks are performed; they do not directly mean safe and unsafe. Likewise, compiled and interpreted are not two perfectly separate classes. Many runtimes interpret some code, compile hot paths later, or transform source into an intermediate representation before execution.

## 工作机制 | How it works

A common toolchain first performs lexical and syntactic analysis, producing a structured representation of source code. It may then resolve names, check types, and run other static analyses. An implementation can compile the result to machine instructions or bytecode, or interpret a representation directly. The runtime performs the program and may manage memory, exceptions, threads, module loading, and interaction with the operating system. This is not one universal pipeline: a scripting runtime may compile modules when they are loaded, while a statically typed language may erase type information before execution.

The guarantees from types have boundaries. A checker may reject adding a known string to a number, but a static declaration alone cannot prove that a network response actually conforms to that declaration. Concurrency memory models, floating-point arithmetic, and undefined behavior also separate “the code looks reasonable” from “the specification guarantees this result.” In engineering work, consult the language specification, implementation documentation, and version-specific behavior.

## 一个例子 | A worked example

Suppose a TypeScript program defines `function greet(name: string) { return "Hi " + name; }`. The checker can report an error when a known call site passes a number. The JavaScript engine executes the emitted JavaScript; the runtime does not retain TypeScript's `string` constraint. If `name` came from JSON, the program still needs to parse and validate that external value at the boundary. Casting the network object to a TypeScript type tells the checker to trust the author; it performs no runtime validation. This example shows how language tools work together and why static checking does not replace input validation.

## 局限与误解 | Limits and misconceptions

Language features do not automatically produce good software. A stricter type system can make some inconsistencies fail earlier, but unclear design, incorrect business assumptions, and resource races remain possible. A dynamic language can still provide strong feedback through tests, static analysis, and explicit interfaces. Performance cannot be inferred from a language label alone: algorithmic complexity, memory access, runtime implementation, and workload distribution often matter more. Beginners also mistake one compiler version's behavior for a language rule. For an important boundary, consult the specification and write a small experiment.

## 相关标本 | Related specimens

Continue with [Frameworks and Libraries](/entries/frameworks-libraries), [Browser Interfaces](/entries/frontend-development), and [API Services](/entries/backend-services). [Parser](/entries/parser) focuses on turning source text into a structure according to a grammar, one stage in language implementation.

## 参考资料 | References

- [MDN: JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [ECMAScript Language Specification](https://tc39.es/ecma262/)
:::
