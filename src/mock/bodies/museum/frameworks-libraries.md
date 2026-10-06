:::zh
**框架与库：控制权、复用与边界**回答一个日常问题：当项目已经需要处理路由、数据访问、界面渲染等重复工作时，应该直接调用一组库，还是让一个框架组织整个程序？二者都能复用成熟代码，主要差别往往在控制流。使用库时，应用通常在自己决定的时刻调用库；使用框架时，框架通常掌握生命周期，并在特定扩展点调用应用代码。这种“控制反转”是有用的观察角度，但不是所有产品都有统一的术语定义，具体项目可能同时包含框架、插件和大量库。

## 定义与边界 | Definition and boundaries

库提供可由应用选择和组合的能力，例如日期处理、HTTP 客户端或组件。框架通常规定一部分应用结构、初始化顺序、配置约定和扩展接口。依赖注入是实现控制反转的一种常见方式：对象不在内部自行创建所有协作者，而由外部组装并传入。依赖注入容器只是其中一种机制；函数参数、构造器参数和插件注册也都能形成边界。

选择依据不是“框架先进还是库自由”，而是应用愿意把多少决策委托出去。框架能统一约定并减少胶水代码，也会带来版本升级、生命周期和约定学习成本。一个生态常由多层构成：Web 框架调用数据库库，数据库库再使用网络客户端，而应用仍要决定领域规则与失败处理。

## 工作机制 | How it works

典型框架会在启动时读取配置、构建依赖、注册路由或插件，然后在事件到来时调用对应处理器。框架定义可扩展的位置，应用在这些位置提供代码。相反，直接使用库时，应用控制主要循环：它可以先读文件，再调用解析库，最后决定是否写入数据库。两者边界可以被组合，而不必把整个项目归为单一类别。

判断某个依赖带来的实际约束，可以问三个问题：谁拥有主要执行循环？应用需要遵守哪些约定？升级后哪些内部接口可能改变？如果小型功能需要同时编写配置、适配层和生命周期钩子，依赖可能过重；如果多个团队重复解决认证、路由、观测等横切问题，统一框架又可能降低维护成本。依赖注入的价值在于让构造和选择显式可见，方便替换、测试和控制生命周期，而不是为了把每个对象都变成接口。

## 一个例子 | A worked example

一个购物 API 可以使用轻量 HTTP 库，应用自行创建服务器、注册路由、解析请求，再调用订单服务；也可以使用较完整的 Web 框架，按它的路由和依赖注入约定提供订单处理器。两种方案都能得到 `/orders` 端点。若业务需要多个协议或自定义请求生命周期，较少框架约束可能更合适；若团队需要一致的认证、配置和错误处理，框架提供的共同结构更重要。无论采用哪种方式，订单服务仍应负责业务不变量，框架不应代替领域建模。

## 局限与误解 | Limits and misconceptions

框架不一定比库“大”，库也不一定没有约定。现实代码依赖链常常交错；“调用者 / 被调用者”是分析控制权的线索，不是严格的分类证明。引入框架会把升级节奏和故障面带入项目；自行组合库则把集成、兼容性和安全更新责任交给团队。过度抽象同样会让测试只验证模拟对象，绕开真实边界。应围绕生命周期、扩展点、依赖方向、可测试性和退出成本做小型试验，再决定长期承诺。

## 相关标本 | Related specimens

可继续阅读[编程语言](/entries/programming-languages)、[浏览器中的界面](/entries/frontend-development)、[API 服务](/entries/backend-services)和[开发工具链](/entries/toolchain-automation)。

## 参考资料 | References

- [Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- [Django: Overview](https://www.djangoproject.com/start/overview/)
- [React: Learn React](https://react.dev/learn)
:::

:::en
**Frameworks and Libraries: Control, Reuse and Boundaries** addresses a familiar choice: when a project repeats work such as routing, data access, or interface rendering, should it call a set of libraries directly, or let a framework organize the application? Both approaches reuse mature code. Their most useful distinction is often control flow. With a library, the application usually calls the library at a time it chooses. With a framework, the framework usually owns parts of the lifecycle and calls application code at designated extension points. This “inversion of control” is a useful lens, not a universal product taxonomy; a real system can contain a framework, plugins, and many libraries at once.

## 定义与边界 | Definition and boundaries

A library provides capabilities that an application can choose and compose, such as date handling, an HTTP client, or UI components. A framework typically prescribes part of the application's structure, initialization order, configuration conventions, and extension interfaces. Dependency injection is one common way to implement inversion of control: an object receives collaborators assembled from outside rather than creating all of them internally. A dependency-injection container is only one mechanism. Function parameters, constructor arguments, and plugin registration can also establish boundaries.

The choice is not “frameworks are modern” versus “libraries are free.” It is about how many decisions the application is willing to delegate. A framework can unify conventions and reduce glue code, while introducing upgrade, lifecycle, and learning costs. A typical ecosystem is layered: a web framework calls a database library, which may use a network client, while the application remains responsible for domain rules and failure handling.

## 工作机制 | How it works

A framework commonly reads configuration, assembles dependencies, and registers routes or plugins at startup. When an event arrives, it invokes the matching handler. The framework defines where extension is allowed, and the application supplies code at those points. With a library, by contrast, the application may own the main loop: it can read a file, call a parser, and then decide whether to write a database record. These patterns can be combined; a project does not need to fit one label everywhere.

To understand the constraints of a dependency, ask three questions: who owns the main execution loop, what conventions must the application follow, and which internal interfaces may change during an upgrade? If a small feature requires extensive configuration, adapters, and lifecycle hooks, the dependency may be too heavy. If several teams repeatedly solve cross-cutting problems such as authentication, routing, and observability, a shared framework can lower maintenance costs. Dependency injection is useful when it makes construction and selection explicit, supporting replacement, testing, and lifecycle control. It is not a reason to turn every object into an interface.

## 一个例子 | A worked example

A shopping API could use a lightweight HTTP library. The application creates the server, registers routes, parses requests, and calls an order service. Or it could use a fuller web framework and provide an order handler according to the framework's routing and injection conventions. Both can expose a `/orders` endpoint. If the business needs several protocols or a custom request lifecycle, fewer framework constraints may help. If the team needs consistent authentication, configuration, and error handling, shared structure may matter more. In either case, the order service should protect business invariants; a framework does not replace domain modeling.

## 局限与误解 | Limits and misconceptions

A framework is not always “large,” and a library is not necessarily free of conventions. Dependency graphs interweave in real applications. “Caller” and “callee” are clues for analyzing control, not a strict proof of product category. A framework adds its upgrade schedule and failure surface to a project; composing libraries makes the team responsible for integration, compatibility, and security updates. Excessive abstraction can also leave tests exercising mocks while bypassing real boundaries. Use a small trial to evaluate lifecycle, extension points, dependency direction, testability, and exit cost before making a long-term commitment.

## 相关标本 | Related specimens

Continue with [Programming Languages](/entries/programming-languages), [Browser Interfaces](/entries/frontend-development), [API Services](/entries/backend-services), and [Development Toolchains](/entries/toolchain-automation).

## 参考资料 | References

- [Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- [Django: Overview](https://www.djangoproject.com/start/overview/)
- [React: Learn React](https://react.dev/learn)
:::
