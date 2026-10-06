:::zh
**可维护软件：模块边界、重构与技术债**关注的是软件经过多轮需求、人员和环境变化后，团队能否继续理解并安全地改变它。可维护性不是代码短、抽象多或测试覆盖率高的同义词；它反映的是定位知识、判断影响、实施改动和确认结果所需的成本。程序运行正确是一项重要属性，但若每次小改动都难以估算风险、容易波及无关模块，系统仍然难以长期演进。

## 定义与边界 | Definition and boundaries

模块边界的作用是把可能变化的决策藏在稳定接口后面，让相关实现保持在一起。Parnas 的模块化原则强调，分解系统应依据设计决策和信息隐藏，而不只是把步骤机械拆成文件。良好边界让调用者依赖契约，不必知道内部数据结构；边界不佳则会出现跨模块读写、重复规则和对实现细节的隐式假设。

重构是以小步修改内部结构，同时保持外部可观察行为不变。自动测试能为行为保持提供反馈，但还需审查数据库结构、协议、时序和性能等不可轻易在单测中表达的契约。技术债是描述短期设计捷径对后续改变造成负担的隐喻，不等同于所有不整洁代码；它需要说明当时的取舍、付出的利息和偿还条件。

## 工作机制 | How it works

维护成本常来自变化耦合：一个业务规则散落多处、一个模块既负责协议又负责持久化、一个类型或字段被外部代码当成稳定 API。先从实际改动记录、缺陷和测试失败中找出频繁变化的轴，再设计能隔离该变化的接口。把调用者需要的决策放在接口上，把实现选择留在模块内部；只有当两个部分会因同一原因变化或需要同一不变量时，才应让它们紧密协作。

实施重构时先建立可观察基线，再做可逆的小步骤：增加 characterization test、提取函数或模块、切换一个调用点、观察 diff 和测试结果，最后删除旧路径。重命名、搬移和行为变化要分开，便于审阅。对跨服务或数据库变更，使用兼容阶段：先增加可并存的新字段或接口，迁移调用方，再移除旧形式。

## 一个例子 | A worked example

假设三个 API 端点各自实现相同的权限判断，其中一处已忘记检查团队成员关系。先添加测试描述“成员只能访问本团队文档”，让当前缺陷可见；再把规则提取到共享的授权服务，并让三个端点调用它。评审时确认共享抽象确实承载相同的业务不变量，而不是单纯减少行数。随后在集成测试中覆盖不同角色和跨团队资源。此时维护改善体现在新规则有唯一负责位置、调用入口可搜索、错误行为有统一检查，并不取决于文件数是否减少。

## 局限与误解 | Limits and misconceptions

重构不是一次性“清理”，也不保证每层抽象都值得长期保留。太小的函数、无处不在的接口或过度泛化的框架，可能增加导航成本。测试会漏掉未建模的行为；注释也可能随代码过期。技术债的隐喻容易被用来给所有重写辩护，因此应具体记录它阻碍哪类变化、实际带来多少返工或故障，以及修复是否比绕行更划算。团队需要在产品交付、风险降低和可理解性之间持续平衡。

## 相关标本 | Related specimens

可继续阅读[框架与库](/entries/frameworks-libraries)、[测试与调试](/entries/testing-debugging)、[开发工具链](/entries/toolchain-automation)和[代码评审与反馈](/entries/effective-code-review)。

## 参考资料 | References

- [D. L. Parnas (1972): On the Criteria To Be Used in Decomposing Systems into Modules](https://doi.org/10.1145/361598.361623)
- [Accessible paper copy hosted by Colorado State University](https://www.cs.colostate.edu/~france/CS314/Readings/Parnas-decomposition.pdf)
- [Martin Fowler: Refactoring](https://refactoring.com/)
- [Martin Fowler: Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
:::

:::en
**Maintainable Software: Module Boundaries, Refactoring and Technical Debt** asks whether a team can keep understanding and safely changing software as requirements, people, and environments change. Maintainability is not synonymous with short code, numerous abstractions, or high test coverage. It reflects the cost of locating knowledge, judging impact, making a change, and confirming the result. Correct execution is important, but a system remains difficult to evolve when small changes have uncertain risk and can affect unrelated modules.

## 定义与边界 | Definition and boundaries

Module boundaries hide decisions likely to change behind stable interfaces and keep related implementation together. Parnas's modularity principle argues that systems should be decomposed around design decisions and information hiding, rather than mechanically splitting a sequence of steps into files. A good boundary lets callers depend on a contract without knowing the internal data structures. A poor boundary often exposes cross-module writes, duplicated rules, or implicit assumptions about implementation details.

Refactoring changes internal structure in small steps while preserving externally observable behavior. Automated tests provide feedback on preservation, but contracts such as database structures, protocols, timing, and performance may need other forms of review. Technical debt is a metaphor for the future burden caused by a short-term design shortcut. It is not a synonym for every untidy piece of code. Describe the original tradeoff, the interest it incurs, and the conditions under which repayment makes sense.

## 工作机制 | How it works

Maintenance costs often come from change coupling: one business rule is scattered across several places, a module handles both protocol and persistence, or external code treats an internal field as a stable API. Look at actual change history, defects, and test failures to identify axes that change frequently. Then design an interface that isolates that change. Put decisions callers need on the interface and leave implementation choices inside the module. Make components collaborate closely only when they change for the same reason or must preserve the same invariant.

For a refactoring, establish an observable baseline, then make reversible steps: add a characterization test, extract a function or module, switch one caller, inspect the diff and test results, and only then remove the old path. Separate renaming and moving from behavior changes so reviewers can see what happened. For cross-service or database changes, use a compatibility phase: introduce a new field or interface that can coexist, migrate callers, and remove the old form later.

## 一个例子 | A worked example

Suppose three API endpoints each implement the same permission check, and one has forgotten to check team membership. First add a test for “a member can access documents in their own team,” making the current defect observable. Then extract the rule into a shared authorization service and have all three endpoints call it. During review, confirm that the abstraction protects a genuine shared business invariant rather than merely reducing line count. Add integration cases for different roles and cross-team resources. The maintenance improvement is that a new rule has one responsible location, callers are searchable, and error behavior has a common check. It does not depend on reducing the file count.

## 局限与误解 | Limits and misconceptions

Refactoring is not a one-time “cleanup,” and not every abstraction deserves to remain. Tiny functions, interfaces everywhere, or an over-generalized framework can increase navigation cost. Tests miss behavior that has not been modeled, and comments can become stale. The technical-debt metaphor can be used to justify any rewrite, so be specific about which changes it blocks, how much rework or failure it causes, and whether repayment is cheaper than a workaround. Teams must continually balance product delivery, risk reduction, and understandability.

## 相关标本 | Related specimens

Continue with [Frameworks and Libraries](/entries/frameworks-libraries), [Testing and Debugging](/entries/testing-debugging), [Development Toolchains](/entries/toolchain-automation), and [Effective Code Review](/entries/effective-code-review).

## 参考资料 | References

- [D. L. Parnas (1972): On the Criteria To Be Used in Decomposing Systems into Modules](https://doi.org/10.1145/361598.361623)
- [Accessible paper copy hosted by Colorado State University](https://www.cs.colostate.edu/~france/CS314/Readings/Parnas-decomposition.pdf)
- [Martin Fowler: Refactoring](https://refactoring.com/)
- [Martin Fowler: Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
:::
