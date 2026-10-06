:::zh
**API 服务：请求、业务逻辑与数据**介绍服务器端如何把一个外部请求转化为有边界、可观测的业务操作。后端服务通常负责协议入口、身份与权限检查、领域规则、数据访问、异步工作以及与其他服务的协作。API 是服务向调用者暴露的契约，可以是 HTTP、消息队列或程序接口；REST 只是描述网络架构约束的一种风格，不能与“HTTP API”简单画等号。

## 定义与边界 | Definition and boundaries

HTTP 将请求和响应建模为带方法、目标、首部和可选内容的消息。方法语义很重要：例如 GET 用于获取表述，安全方法表示客户端不请求改变目标资源状态，PUT 的语义旨在幂等，而 POST 的效果由目标资源定义。服务的领域层则解释“创建订单”意味着什么；不能把 HTTP 路由名、数据库表和业务概念混为一谈。

一个接口契约至少需要说明输入、输出、错误、身份验证、授权、兼容性和资源限制。认证回答“调用者是谁”，授权回答“它可以做什么”。访问数据库前要验证格式和业务不变量，并只返回调用者有权看到的数据。部署层还需要明确端口、配置、健康检查、超时和关闭行为。

## 工作机制 | How it works

常见的请求路径是：接收连接，解析并校验协议输入，识别调用者，执行授权检查，把命令交给领域逻辑，读写持久存储，再生成状态码、首部和响应体。横切关注点可以放在中间件或网关，但最终仍须在可信的服务边界验证权限。一次 HTTP 请求也可能只确认已接受异步任务，真正处理在后台队列完成，因此 API 应明确告诉调用者其状态如何查询。

服务稳定性取决于每一层的超时、容量和重试语义。调用超时后，客户端并不总能知道服务器是否已经完成操作；盲目重试付款或创建资源可能造成重复副作用。应结合幂等键、幂等方法、业务去重和可追踪的请求标识设计。REST 的无状态约束指每个请求包含理解该请求所需的上下文，并不要求系统不使用数据库、缓存或会话存储。

## 一个例子 | A worked example

创建订单的 `POST /orders` 可以检查用户身份、购物车商品价格和库存，再在事务里创建订单记录并返回 `201 Created` 与资源地址。如果用户重复提交，网络层重发请求可能再次进入服务；客户端生成并重用幂等键，服务保存键与处理结果的关联，便可把重复传输映射到同一业务操作。若库存服务超时，应返回可理解的失败或待处理状态，并留下可查询的关联标识。这个设计仍需评估键有效期、并发请求和部分失败，不能只依赖一个“重试三次”的通用策略。

## 局限与误解 | Limits and misconceptions

微服务不是可靠性的同义词。拆分会增加网络故障、部署协调和数据一致性问题；单体服务也能拥有清楚模块边界。HTTP 状态码不能替代领域错误模型，日志也不能单独代表可观测性。应从业务不变量、调用方需要、数据所有权和团队维护能力出发，决定同步/异步、服务数量和存储边界。为已有 API 修改方法语义或错误形状会影响客户端，应版本化或提供兼容迁移路径。

## 相关标本 | Related specimens

可继续阅读[框架与库](/entries/frameworks-libraries)、[浏览器中的界面](/entries/frontend-development)、[测试与调试](/entries/testing-debugging)和[可维护软件](/entries/maintainable-software)。

## 参考资料 | References

- [IETF RFC 9110: HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110)
- [Roy Fielding: Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [The Twelve-Factor App: Processes](https://12factor.net/processes)
- [The Twelve-Factor App: Port Binding](https://12factor.net/port-binding)
:::

:::en
**API Services: Requests, Business Logic and Data** explains how a server turns an external request into a bounded and observable business operation. A backend service commonly handles protocol entry, identity and permission checks, domain rules, data access, asynchronous work, and collaboration with other services. An API is a contract exposed to callers; it may use HTTP, a message queue, or a programming interface. REST describes a set of architectural constraints for network systems and should not be treated as a synonym for “HTTP API.”

## 定义与边界 | Definition and boundaries

HTTP models requests and responses as messages with a method, target, headers, and optional content. Method semantics matter. GET retrieves a representation; a safe method means the client does not request a change to the target resource's state; PUT is intended to be idempotent; and the effect of POST is defined by the target resource. The domain layer gives meaning to “create an order.” A route name, database table, and business concept are not interchangeable.

An API contract should explain inputs, outputs, errors, identity, authorization, compatibility, and resource limits. Authentication answers who the caller is; authorization answers what it may do. Before accessing a database, validate input and business invariants, and return only data the caller may see. The deployment contract should also make ports, configuration, health checks, timeouts, and shutdown behavior explicit.

## 工作机制 | How it works

A common request path accepts a connection, parses and validates protocol input, identifies the caller, checks authorization, sends a command to domain logic, reads or writes persistent storage, and builds a status code, headers, and response body. Middleware and gateways can handle cross-cutting concerns, but authorization must still be enforced at a trusted service boundary. An HTTP request may only acknowledge that an asynchronous task was accepted; the real work can happen later in a queue. The API should tell callers how to query that task's state.

Service reliability depends on the timeout, capacity, and retry semantics of every layer. After a timeout, a client may not know whether the server completed the operation. Blindly retrying a payment or resource creation can therefore cause duplicate side effects. Design with idempotency keys, idempotent methods, business-level deduplication, and traceable request identifiers. REST's stateless constraint means each request carries the context needed to understand it; it does not prohibit databases, caches, or session storage.

## 一个例子 | A worked example

A `POST /orders` endpoint can check the user's identity, product prices, and inventory, create an order in a transaction, then return `201 Created` with a resource location. If the user submits twice, a network retry may reach the service twice. The client can generate and reuse an idempotency key; the service records the key with the processing result and maps a repeated transmission to the same business operation. If the inventory service times out, return an understandable failure or pending state and a traceable request identifier. This design still requires decisions about key lifetime, concurrent requests, and partial failure. A generic “retry three times” policy is not enough.

## 局限与误解 | Limits and misconceptions

Microservices are not a synonym for reliability. Splitting a system adds network failures, deployment coordination, and data-consistency problems; a monolithic service can still have clear module boundaries. HTTP status codes do not replace a domain error model, and logs alone do not provide observability. Start from business invariants, caller needs, data ownership, and the team's ability to maintain the system when choosing synchronous versus asynchronous work, service count, and storage boundaries. Changing method semantics or error shapes can break API clients, so use versioning or a compatible migration path.

## 相关标本 | Related specimens

Continue with [Frameworks and Libraries](/entries/frameworks-libraries), [Browser Interfaces](/entries/frontend-development), [Testing and Debugging](/entries/testing-debugging), and [Maintainable Software](/entries/maintainable-software).

## 参考资料 | References

- [IETF RFC 9110: HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110)
- [Roy Fielding: Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [The Twelve-Factor App: Processes](https://12factor.net/processes)
- [The Twelve-Factor App: Port Binding](https://12factor.net/port-binding)
:::
