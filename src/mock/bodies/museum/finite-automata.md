:::zh
**有限自动机：状态与计算边界**把字符串识别写成有限状态之间的转移。它适用于只需保留有限种“到目前为止的信息”的任务，例如词法扫描、协议阶段检查和简单模式匹配。条目在策展目录中对应 **Danaus plexippus**（Danaus 属）；该映射只是索引关系，本文不从技术模型推断物种行为。

## 定义与边界 | Definition and boundaries

确定有限自动机可写作五元组 $(Q,\Sigma,\delta,q_0,F)$：$Q$ 是有限状态集合，$\Sigma$ 是输入字母表，$\delta:Q\times\Sigma\to Q$ 给出每个状态读到一个符号后的唯一后继，$q_0$ 是起始状态，$F$ 是接受状态集合。把输入从左到右读完后，若所在状态属于 $F$，机器就接受该串。[Cambridge 讲义](https://www.cl.cam.ac.uk/teaching/1213/RLFA/reglfa-notes.pdf)逐步定义有限状态机、确定性与非确定性；[UPenn 课程讲义](https://www.cis.upenn.edu/~cis5110/notes/tcbook-lang.pdf)也把转移函数写成有限状态与字母表上的映射，并展开等价形式。有限自动机的“有限”不是输入长度有限，而是机器可记住的状态只有有限种。

## 工作机制 | How it works

处理输入时，自动机只保留当前状态，不必保存全部前缀。状态的含义由未来任务决定：它应概括哪些历史差异还会影响之后的接受结果。非确定有限自动机允许同一输入符号对应多个候选后继，或允许空串转移；这改变了描述方式，不扩大可识别语言的范围。通过子集构造，可以把一个 NFA 转成状态为原状态子集的 DFA，最坏情况下状态数可达 $2^n$。有限自动机、正则表达式及正规语言的等价关系，使其可以用于扫描文本、验证格式和构建词法分析器，但各表示在大小与运行效率上的代价不同。

## 一个例子 | A worked example

要判断一个二进制数是否能被 3 整除，只需记住已经读入的前缀除以 3 的余数 $r\in\{0,1,2\}$。读到下一位 $b$ 后，新数值是旧前缀乘 2 再加 $b$，因此转移为 $r'=(2r+b)\bmod 3$。初态为余数 0，接受态也只有余数 0。输入 110 时，状态依次为 0、1、0、0，故接受；110 的十进制值为 6。每个符号只做一次转移，运行时间为 $O(n)$，状态存储保持常数大小。这不是“自动机懂得除法”，而是问题恰好能被有限余数状态完整概括。

## 局限与误解 | Limits and misconceptions

有限自动机无法处理所有需要上下文的语言。比如识别任意长度且数量相等的 $a^n b^n$，或任意深度正确配对的括号，通常需要随输入增长的计数或栈记忆，不能由固定有限状态完成。Cambridge 讲义列出这些非正规语言并讨论抽水引理；UPenn 讲义进一步用 Myhill–Nerode 等方法描述正规性边界。工程中也要区分理论正则语言与具体正则表达式引擎：反向引用等扩展可能超出纯 DFA 的模型。状态若设计得过粗，会合并对未来输出有影响的历史；设计得过细则造成状态爆炸。模型的边界应由问题要求决定，而不是由图画得是否简洁决定。

## 相关标本 | Related specimens

[算法设计](/entries/algorithm-design)提供从规格到复杂度分析的通用方法；[编译器](/entries/compiler)说明有限状态机如何服务词法分析；[L-System](/entries/l-system)则以字符串重写生成结构，可与状态识别作对照。
:::

:::en
**Finite Automata: States and Computational Limits** represents string recognition as transitions among finitely many states. It is useful when a task needs to retain only finitely many kinds of information about the prefix already read, as in lexical scanning, protocol-stage checks, and simple pattern matching. Its curatorial catalogue pairing is **Danaus plexippus** in genus *Danaus*. The pairing is an index only; no animal behaviour is inferred from the computational model.

## 定义与边界 | Definition and boundaries

A deterministic finite automaton can be written as the five-tuple $(Q,\Sigma,\delta,q_0,F)$. The set $Q$ contains finitely many states, $\Sigma$ is the input alphabet, and $\delta:Q\times\Sigma\to Q$ gives the unique next state for each current state and input symbol. The state $q_0$ is the start state and $F$ is the set of accepting states. After the whole input has been consumed, the automaton accepts exactly when its current state belongs to $F$. The [Cambridge lecture notes](https://www.cl.cam.ac.uk/teaching/1213/RLFA/reglfa-notes.pdf) develop finite-state machines, determinism, and nondeterminism. The [University of Pennsylvania notes](https://www.cis.upenn.edu/~cis5110/notes/tcbook-lang.pdf) give the transition function over a finite state set and alphabet, then relate automata to other descriptions of regular languages. “Finite” refers to the machine’s number of memory states, not to the length of the input.

## 工作机制 | How it works

As it reads input from left to right, the machine retains only its current state; it need not store the entire prefix. The meaning of a state depends on the task: it should summarize precisely those distinctions in the past that can still affect whether a future suffix is accepted. A nondeterministic finite automaton may have several possible next states for one symbol or an empty-string transition. This changes how the machine is described, but not which languages it can recognize. Subset construction converts an NFA into a DFA whose states are subsets of the original states; in the worst case, an automaton with $n$ NFA states can yield up to $2^n$ DFA states. The equivalence among finite automata, regular expressions, and regular languages supports text scanning, format checks, and lexer construction, although each representation can differ substantially in size and execution cost.

## 一个例子 | A worked example

To decide whether a binary integer is divisible by three, retain only the remainder $r\in\{0,1,2\}$ of the prefix read so far. When the next bit is $b$, the represented value becomes twice the old value plus $b$, so the transition is $r'=(2r+b)\bmod 3$. The initial state is remainder zero, and remainder zero is the only accepting state. On input 110, the states are 0, 1, 0, and 0, so the string is accepted; its value is decimal 6. Each input symbol causes one transition, giving $O(n)$ time for an input of length $n$, while the state storage remains constant. The automaton does not perform unbounded arithmetic. The problem happens to admit a complete summary with only three possible remainders.

## 局限与误解 | Limits and misconceptions

Finite automata cannot recognize every language that requires context. Recognizing $a^n b^n$ for arbitrary $n$, or parentheses with arbitrarily deep balanced nesting, normally requires a counter or stack whose capacity grows with the input. The Cambridge notes list such non-regular languages and discuss the pumping lemma; the Pennsylvania notes also cover Myhill–Nerode characterizations of the boundary. In engineering, distinguish the formal regular languages from the behaviour of a particular regular-expression engine: extensions such as backreferences can exceed the pure finite-automaton model. States that are too coarse merge histories that a future decision still needs; states that are too fine create unnecessarily large machines. The right state model follows from the recognition requirement, not from whether a state diagram looks simple.

## 相关标本 | Related specimens

[Algorithm Design](/entries/algorithm-design) provides a general path from specification to complexity analysis. [Compilers](/entries/compiler) shows how automata support lexical analysis. [L-Systems](/entries/l-system) generates structures through string rewriting and offers a useful contrast with recognition.
:::
