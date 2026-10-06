:::zh
**可重复部署**是把软件制品、运行配置和交付步骤明确化，使同一版本可以在不同环境按可审计流程被重新构建与发布。容器镜像能封装用户空间文件和启动元数据，配置则应与制品分离；“同一个镜像”不意味着外部数据库、密钥、主机内核或运行时状态也相同。[S1][S2]
:::

:::en
**Repeatable deployment** makes software artifacts, runtime configuration, and delivery steps explicit so the same version can be rebuilt and released across environments through an auditable process. A container image can package user-space files and startup metadata, while configuration should remain separate from the artifact. “The same image” does not imply that an external database, secret, host kernel, or runtime state is also identical. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
可重复性首先要求描述完整：源代码版本、编译器与依赖、基础镜像、构建参数、配置来源和迁移步骤都应可追溯。OCI 镜像规范定义镜像清单、配置与内容寻址层等互操作格式；部署系统再把镜像摘要、环境配置、资源限制和启动命令组合成一次发布。构建可复现与部署可重复相关但不相同：前者要求相同输入产出相同字节，后者还要求目标环境按相同程序应用制品并能验证结果。[S1]
:::

:::en
Repeatability starts with a complete description: source revision, compiler and dependencies, base image, build arguments, configuration source, and migration steps must be traceable. The OCI image specification defines interoperable formats for image manifests, configuration, and content-addressed layers. A deployment system combines an image digest with environment configuration, resource limits, and a start command for a release. Reproducible builds and repeatable deployments are related but distinct: the former aims for the same bytes from the same inputs, while the latter also applies an artifact through the same procedure and verifies the result in a target environment. [S1]
:::

## 工作机制 | How it works

:::zh
常见流程是从版本控制中的代码开始，在受控构建环境安装锁定依赖，执行测试并生成带摘要的制品；制品进入不可变仓库后，由部署配置引用精确版本，而不是易变的 `latest` 标签。每个环境的 URL、开关和凭据通过外部配置注入，密钥由专门的秘密管理系统提供。发布步骤采用声明式配置和自动化迁移，健康检查通过后再切流；若失败，则回滚到已知制品并按兼容性规则恢复数据。容器只固定应用层文件，不会自动固定宿主内核、网络、时区和外部服务。[S1][S2]
:::

:::en
A common workflow starts from version-controlled source, installs locked dependencies in a controlled build environment, runs tests, and produces an artifact with a digest. Once stored in an immutable registry, deployment configuration refers to that exact version rather than a mutable `latest` tag. Environment-specific URLs, feature switches, and credentials are injected externally, with secrets supplied by a dedicated secret manager. Releases use declarative configuration and automated migrations; traffic shifts only after health checks pass. On failure, the system can return to a known artifact and restore data according to compatibility rules. A container pins application-layer files but does not automatically pin the host kernel, network, time zone, or external services. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
一个 Web 服务先把 Node 版本、包锁文件和基础镜像摘要写入仓库配置。CI 为提交生成镜像 `sha256:…`，运行单元测试、依赖扫描和启动检查；发布清单在测试环境与生产环境都引用这个摘要，只替换数据库地址和秘密引用。每次部署记录代码提交、制品摘要、配置版本、迁移编号和操作者。这样发现问题时，团队可以定位实际运行内容，而不是依赖“当时重新构建出来的大概一样”的镜像。
:::

:::en
A web service records its Node version, package lockfile, and base-image digest in repository configuration. CI builds an image identified by `sha256:…`, then runs unit tests, dependency checks, and a startup check. The deployment manifest uses that same digest in staging and production, changing only the database endpoint and secret references. Each release records the source revision, artifact digest, configuration version, migration number, and operator. When a problem appears, the team can identify what actually ran instead of assuming a freshly rebuilt image is “roughly the same.”
:::

## 局限与误解 | Limits and misconceptions

:::zh
固定镜像只能减少一类差异。随机数、时间戳、未锁定依赖、外部 API、数据库内容和主机硬件仍可能令行为不同；标签可被覆盖，摘要也只证明字节身份，不证明来源可信或内容安全。数据库迁移常常不可逆，回滚应用不一定能回滚数据。秘密若烘焙进镜像会在镜像层和缓存中长期暴露。真正可操作的交付还需签名、来源证明、漏洞扫描、环境漂移检测、备份和演练。容器化不是安全边界或灾难恢复计划的替代品。[S1][S2]
:::

:::en
Pinning an image only reduces one class of variation. Randomness, timestamps, unlocked dependencies, external APIs, database contents, and host hardware can still change behavior. A tag can be overwritten, and a digest proves byte identity, not trustworthy provenance or safe contents. Database migrations are often irreversible, so rolling back an application does not necessarily roll back data. Secrets baked into an image can persist in layers and caches. An operational delivery process also needs signatures, provenance, vulnerability scanning, drift detection, backups, and rehearsals. Containerization is not a replacement for a security boundary or a disaster-recovery plan. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[操作系统内核](/entries/os-kernel)说明容器共享宿主内核的边界；[故障、冗余与恢复](/entries/failure-redundancy-recovery)讨论回滚和恢复策略；[工具链自动化](/entries/toolchain-automation)介绍构建与发布流水线的执行基础。
:::

:::en
[Operating System Kernel](/entries/os-kernel) explains that containers share a host kernel. [Failure, Redundancy and Recovery](/entries/failure-redundancy-recovery) covers rollback and recovery strategies. [Toolchain Automation](/entries/toolchain-automation) introduces the build and release pipeline that executes these steps.
:::

## 参考资料 | References

:::zh
- [S1] Open Container Initiative，*Image Format Specification*。[规范源文档](https://github.com/opencontainers/image-spec/blob/main/spec.md)
- [S2] Adam Wiggins，*The Twelve-Factor App*，配置因素。[在线文档](https://12factor.net/config)
:::

:::en
- [S1] Open Container Initiative, *Image Format Specification*. [Specification source](https://github.com/opencontainers/image-spec/blob/main/spec.md)
- [S2] Adam Wiggins, *The Twelve-Factor App*, “Config.” [Online documentation](https://12factor.net/config)
:::
