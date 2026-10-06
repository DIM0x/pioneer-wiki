:::zh
**测试与调试：定位原因与验证修复**把两种互补的工程活动放在一起：测试通过可重复的输入和预期结果，检查代码是否满足明确条件；调试则从异常观察出发，寻找导致它的原因。测试更适合回答“这项性质在这些条件下是否成立”，调试更适合回答“为什么这次结果不同”。测试可以揭露缺陷，却不能证明所有行为都正确；调试可以解释一次失败，却不能代替能持续运行的回归检查。

## 定义与边界 | Definition and boundaries

一个测试至少要有受控的前置条件、动作、观察结果和判定标准。单元测试针对较小边界，反馈快，常使用替身隔离依赖；集成测试检查真实组件之间的契约；端到端测试则从用户路径确认整个系统协同。测试范围越大，通常越接近真实运行，也越容易受网络、时间和共享环境影响。Google 对测试规模的分类强调测试应明确资源与隔离边界，而不只按测试框架名称区分。

调试是循证过程：稳定复现问题，缩小触发条件，采集状态或日志，提出可以被证伪的原因假设，再通过最小实验排除它们。堆栈轨迹是线索，不总是根因；最近出现的异常也可能是更早状态损坏的下游表现。

## 工作机制 | How it works

先把需求翻译成可观察的性质，例如“重复请求不会重复扣款”，而不是只测试某个内部函数被调用。对正常输入、边界值和故障路径设定独立用例；观察外部可见结果、持久状态和副作用。若测试依赖时钟、随机数、网络或并行执行，应注入可控替代，或在集成层明确依赖真实设施。测试数据应彼此隔离并能清理，避免顺序影响结果。

发现失败后，先确认失败是否可重复，再比较成功与失败条件。使用最小化输入、二分变化或临时观测把范围缩到一个组件；每次只改变一个关键假设。确认根因后，编写能在旧版本上失败、在修复版本上通过的回归测试。对偶发问题，保存时间戳、请求标识、环境版本和并发背景，避免用未经验证的“重跑直到通过”掩盖风险。

## 一个例子 | A worked example

购物车结账偶尔重复创建订单。先使用相同的请求标识重放两次，并确认是否属于同一用户操作；然后检查入口日志、幂等键存储和数据库唯一约束。若发现两个并发请求同时读到“键不存在”，就把测试改成并发触发这两个请求，并断言只生成一个订单和一次付款副作用。修复可能需要原子写入或唯一约束，而不是简单延长超时。最后再运行订单服务集成测试以及正常、超时和重试路径，确保错误响应可追踪。

## 局限与误解 | Limits and misconceptions

覆盖率说明执行了哪些代码，不代表验证了所有重要行为；大量脆弱测试会让团队害怕合理重构。模拟依赖能隔离单元，却可能与真实服务契约漂移；端到端测试虽有价值，若把所有规则都放在这层，反馈速度和故障定位会变差。随机化和并行有时能发现隐藏耦合，也会增加复现难度。保持测试集分层、重要失败可复现、断言对应业务风险，并定期清理无效测试，比追求一个覆盖率数字更有用。

## 相关标本 | Related specimens

继续阅读[可维护软件](/entries/maintainable-software)、[API 服务](/entries/backend-services)、[开发工具链](/entries/toolchain-automation)和[性能分析](/entries/performance-analysis)。

## 参考资料 | References

- [Google Testing Blog: Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html)
- [Google SRE Book: Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [pytest: Good Integration Practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html)
:::

:::en
**Testing and Debugging: Finding Causes and Verifying Fixes** brings together two complementary engineering activities. Testing checks whether code meets stated conditions by using repeatable inputs and expected outcomes. Debugging begins with an unexpected observation and searches for its cause. Testing asks, “Does this property hold under these conditions?” Debugging asks, “Why did this result differ?” Tests can reveal defects without proving all behavior correct; debugging can explain one failure without replacing a durable regression check.

## 定义与边界 | Definition and boundaries

A test needs controlled preconditions, an action, an observation, and a pass criterion. Unit tests exercise a small boundary and give quick feedback, often using substitutes to isolate dependencies. Integration tests examine contracts between real components. End-to-end tests verify that a complete system supports a user path. Larger tests tend to run closer to real conditions, but are also more exposed to networks, time, and shared environments. Google's test-size guidance emphasizes resource and isolation boundaries, rather than classifying tests solely by their framework.

Debugging is an evidence-based process: reproduce a problem, narrow its trigger, collect state or logs, propose causes that can be disproved, and eliminate them with small experiments. A stack trace is a clue, not always the root cause. The latest exception may be downstream from an earlier corruption of state.

## 工作机制 | How it works

Translate requirements into observable properties, such as “a repeated request does not charge twice,” instead of testing only whether an internal function was called. Give normal inputs, boundary values, and failure paths distinct cases. Observe externally visible results, persistent state, and side effects. If tests depend on clocks, randomness, networks, or parallel execution, inject controllable substitutes or state clearly which real infrastructure an integration test requires. Isolate test data and clean it up so order does not affect results.

After a failure, first check that it is repeatable, then compare successful and failing conditions. Use a minimized input, a binary comparison, or temporary instrumentation to narrow the scope to one component. Change one important assumption at a time. Once the root cause is understood, write a regression test that fails on the old version and passes on the fix. For intermittent problems, record timestamps, request identifiers, environment versions, and concurrency context. “Rerun until green” is not evidence that the risk is gone.

## 一个例子 | A worked example

Suppose checkout sometimes creates duplicate orders. Replay the same request identifier twice and confirm whether both attempts represent one user action. Then inspect entry logs, idempotency-key storage, and database uniqueness constraints. If two concurrent requests can both observe that a key is absent, write a test that triggers them concurrently and asserts one order and one payment side effect. The fix may require an atomic write or a unique constraint, not merely a longer timeout. Finally run service integration tests for success, timeout, and retry paths, checking that failures remain traceable.

## 局限与误解 | Limits and misconceptions

Coverage indicates which code ran; it does not show whether every important behavior was checked. A large suite of fragile tests can make teams afraid of reasonable refactoring. Mocked dependencies isolate units, but may drift from real service contracts. End-to-end tests are valuable, yet placing every rule at that layer slows feedback and makes failures harder to locate. Randomized and parallel execution can reveal hidden coupling while making reproduction harder. A layered suite, reproducible important failures, assertions tied to business risk, and regular cleanup are more useful than optimizing one coverage number.

## 相关标本 | Related specimens

Continue with [Maintainable Software](/entries/maintainable-software), [API Services](/entries/backend-services), [Development Toolchains](/entries/toolchain-automation), and [Performance Analysis](/entries/performance-analysis).

## 参考资料 | References

- [Google Testing Blog: Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html)
- [Google SRE Book: Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [pytest: Good Integration Practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html)
:::
