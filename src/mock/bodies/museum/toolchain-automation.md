:::zh
**开发工具链：版本控制、构建与自动化**把从源码到可交付软件的一组工具和流程看作一条可检查的路径。常见环节包括版本控制、依赖解析、编译或打包、测试、制品保存和部署。工具链的目标不是把所有动作自动化，而是让每次改动的来源、输入、结果和失败原因可追踪，并减少“在我的机器上能运行”的差异。

## 定义与边界 | Definition and boundaries

版本控制记录文件随时间的变化与协作关系。Git 使用提交对象连接项目快照，分支是指向提交的可移动引用；它不等同于集中式锁文件。构建将源码及依赖转换成执行文件、包或静态资源。CI 系统在代码变化或其他事件发生时自动运行声明好的作业，但“CI 通过”仅说明这些作业按当前配置完成。

流水线需要明确输入边界：源代码和版本、工具链版本、依赖锁文件、构建参数、环境变量以及可复用缓存。制品应被标识并保存；部署还需明确目标环境、配置、权限、回滚和数据库兼容策略。交付流程涉及凭证时，应由受控密钥存储提供短期权限，不要将机密写进仓库或打印到构建日志。

## 工作机制 | How it works

开发者提交变更后，CI 可以创建干净工作区、安装锁定依赖、运行格式检查、静态分析和测试，再构建带版本标识的制品。提交检查给出快速反馈；合并后流水线可以把相同制品提升到测试或生产环境。若构建阶段和部署阶段重新编译，各阶段可能得到不同结果，因此可复用同一制品，并记录它由哪个提交和构建过程产生。

可重复构建要求相同的受控输入在规定条件下产生可验证的一致产物。固定依赖版本是起点，不是全部：时间戳、随机顺序、网络获取的未锁定资源和主机环境也会影响结果。缓存能够省时，但其键必须包含真正影响输出的输入；错误的缓存边界会复用陈旧产物。

## 一个例子 | A worked example

一个 Web 项目可在拉取请求打开时执行类型检查、单元测试和生产构建，成功后上传带提交 SHA 的制品。审阅通过并合并后，将这个制品部署到预发布环境；冒烟检查通过后再逐步发布到线上。回滚时，团队可以重新部署上一份已验证的制品。若部署需要数据库迁移，迁移应支持新旧应用短暂并存，或清楚定义恢复步骤。流水线不能代替代码审查和上线观测，但它能把重复的验收动作变成有记录的流程。

## 局限与误解 | Limits and misconceptions

自动化不会自动带来可信度：测试可能覆盖不到关键行为，构建凭证可能过宽，依赖也可能被供应链攻击。过多又缓慢的作业会使团队绕过检查；追求完整可重复性也可能让配置复杂到无人理解。流水线应依风险分层，保护发布密钥，最小化权限，并保留失败日志和制品来源。频繁更新依赖和基础镜像，才能使工具链本身保持安全。

## 相关标本 | Related specimens

可继续阅读[测试与调试](/entries/testing-debugging)、[可维护软件](/entries/maintainable-software)、[框架与库](/entries/frameworks-libraries)和[云与 DevOps 相关的可重复部署](/entries/repeatable-deployment)。

## 参考资料 | References

- [Pro Git: Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [GitHub Actions: Understanding GitHub Actions](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions)
- [Reproducible Builds: Definitions](https://reproducible-builds.org/docs/)
:::

:::en
**Development Toolchains: Version Control, Builds and Automation** treats the route from source code to deliverable software as a sequence of tools and processes that should be inspectable. Typical stages include version control, dependency resolution, compilation or packaging, tests, artifact storage, and deployment. The goal is not to automate every action. It is to make the origin, inputs, outputs, and failure reasons of each change traceable, reducing differences between “it works on my machine” and shared environments.

## 定义与边界 | Definition and boundaries

Version control records how files change over time and how people collaborate. Git connects project snapshots through commit objects; a branch is a movable reference to a commit, not the same thing as a centralized lock file. A build transforms source and dependencies into an executable, package, or static asset. A CI system runs declared jobs when code changes or other events occur, but “CI passed” means only that those configured jobs completed.

A pipeline should make its input boundary explicit: source and revision, toolchain versions, dependency lock files, build parameters, environment variables, and reusable caches. Artifacts should be identified and stored. Deployment also needs a target environment, configuration, permissions, rollback procedure, and database compatibility plan. When a delivery flow uses credentials, supply short-lived access from a controlled secret store. Do not put secrets in the repository or print them to build logs.

## 工作机制 | How it works

After a developer submits a change, CI can create a clean workspace, install locked dependencies, run formatting checks, static analysis, and tests, then build an artifact marked with a version. Pull-request checks give fast feedback; after merge, a pipeline can promote the same artifact to test or production environments. If each stage recompiles, it may produce different outputs. Reusing the same artifact and recording the commit and build process that produced it improves traceability.

Reproducible builds aim for controlled inputs to produce verifiably consistent outputs under stated conditions. Pinning dependencies is a starting point, not the whole solution: timestamps, nondeterministic ordering, unlocked network resources, and host environments can also affect results. Caches save time, but their keys must include every input that affects output; a wrong cache boundary can reuse stale artifacts.

## 一个例子 | A worked example

A web project can run type checks, unit tests, and a production build when a pull request opens, then upload an artifact tagged with the commit SHA. After review and merge, deploy that artifact to staging. Once smoke checks pass, release gradually to production. For rollback, redeploy a previously verified artifact. If deployment requires a database migration, the migration should support temporary coexistence between old and new application versions or define a clear recovery procedure. A pipeline cannot replace code review and production observation, but it can make repeated acceptance steps a recorded process.

## 局限与误解 | Limits and misconceptions

Automation does not automatically establish trust. Tests may miss critical behavior, build credentials may be too broad, and dependencies can be compromised through the supply chain. Too many slow jobs encourage teams to bypass checks; pursuing perfect reproducibility can create configuration no one understands. Organize pipeline checks by risk, protect release credentials, minimize permissions, and retain failure logs and artifact provenance. Regularly update dependencies and base images so the toolchain itself remains secure.

## 相关标本 | Related specimens

Continue with [Testing and Debugging](/entries/testing-debugging), [Maintainable Software](/entries/maintainable-software), [Frameworks and Libraries](/entries/frameworks-libraries), and [Repeatable Deployment](/entries/repeatable-deployment).

## 参考资料 | References

- [Pro Git: Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [GitHub Actions: Understanding GitHub Actions](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions)
- [Reproducible Builds: Definitions](https://reproducible-builds.org/docs/)
:::
