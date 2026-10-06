:::zh
**模型服务**把训练完成的模型及其必要运行组件部署为可被应用调用的推理能力。它包括加载正确版本的权重与配置、接收请求、执行预处理和前向计算、把结果转为约定格式，并管理容量、版本与运行状态。推理是其中的计算步骤；服务还要处理网络、队列、并发、故障和运维。本文的博物学对应物是 **Nucifraga caryocatactes**（星鸦），仅为策展配对。

## 定义与边界 | Definition and boundaries

模型服务的接口可以是在线 HTTP/gRPC 端点、批量作业或嵌入式运行库。典型在线请求经过校验和预处理，进入队列或动态批次，交给模型执行，再经过后处理返回预测。模型文件不是完整服务：Tokenizer、图像归一化、标签映射、特征列顺序和数值精度等运行约定必须与训练时一致。服务层还负责鉴权、超时、限流、版本选择、健康检查和观测。系统研究如 [Clipper](https://www.usenix.org/system/files/conference/nsdi17/nsdi17-crankshaw.pdf) 把在线预测服务中的模型执行与系统级调度、批处理等问题分开讨论。

## 工作机制 | How it works

部署时先把模型制品、预处理代码、依赖和配置绑定为可识别版本，再启动一个或多个推理工作进程并加载制品。请求入口检查模式、大小与授权，随后路由到目标模型版本。调度器可以并发处理独立请求，或把兼容请求短暂聚成一个批次，以更充分利用加速器。批次完成后，服务应用后处理并返回结果，同时记录延迟、错误、吞吐和资源指标。版本管理应支持渐进切流、回滚与健康探针；扩容要考虑模型加载时间和显存或内存占用。[NVIDIA Triton 的批处理指南](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html)说明动态批次调度，[Amazon SageMaker 的推理部署指南](https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html)展示托管端点的部署和调用方式。

## 一个例子 | A worked example

假设团队训练了邮件分类器。客户端发送一封邮件，端点先确认请求字段和大小，再使用与训练相同的 Tokenizer 将文本转成张量。运行中的模型给出垃圾邮件分数，后处理把分数映射为类别并返回 JSON。高峰期可以把多封独立邮件放进同一批次推理；但若队列等待过久，服务应按超时策略处理，而不是无限等待。上线新版本时，可以让少量请求先走新模型，对比两版的错误率、延迟和资源占用，再继续切流或回滚。离线批量打分则可以复用制品和预处理约定，但通常不需要为单次请求提供低延迟保证。

## 局限与误解 | Limits and misconceptions

低延迟、高吞吐和低成本会互相牵制。增大批次可能提高硬件利用率，却增加排队和等待；更多副本可能降低队列延迟，也会增加固定成本。平均延迟掩盖慢请求，因此常需同时看 p50、p95 或更高分位数、超时率、错误率和吞吐。服务稳定不代表模型预测正确：模型质量仍要由任务评测和真实反馈验证。预处理或模型版本不匹配会产生表面正常但意义错误的预测；日志保存原始输入则可能泄露敏感信息。冷启动、负载突增、显存不足、下游网络故障和不兼容更新都需要独立的容量、告警和恢复设计。部署平台能管理端点，并不能替团队定义可接受的质量、延迟或隐私边界。

## 相关标本 | Related specimens

[反向传播](/entries/backpropagation)解释模型训练时的梯度计算；[大语言模型如何生成](/entries/llm-generation)解释语言模型单次推理的 Token 循环；[AI 评测](/entries/ai-evaluation)则为上线前后的任务质量提供测量方法。模型服务负责把制品可靠地送入使用场景，不会替代训练与评测。

:::

:::en
**Model serving** deploys a trained model and its required runtime components as an inference capability that applications can call. It loads the intended weights and configuration, receives requests, performs preprocessing and a forward pass, converts results to an agreed response format, and manages capacity, versions, and service health. Inference is one computation within this system; serving also handles networking, queues, concurrency, failures, and operations. Its curatorial natural-history counterpart is *Nucifraga caryocatactes*, the spotted nutcracker; the pairing is part of the catalogue.

## 定义与边界 | Definition and boundaries

A serving interface may be an online HTTP or gRPC endpoint, a batch job, or an embedded runtime. A typical online request is validated and preprocessed, enters a queue or dynamic batch, runs through a model, and passes through postprocessing before a response is returned. Model weights alone are not a complete service. Tokenizers, image normalization, label maps, feature ordering, and numerical precision must remain compatible with training. The service layer also handles authorization, timeouts, rate limits, version selection, health checks, and observability. Systems research such as [Clipper](https://www.usenix.org/system/files/conference/nsdi17/nsdi17-crankshaw.pdf) treats model execution and system concerns such as scheduling and batching as distinct parts of online prediction.

## 工作机制 | How it works

Deployment binds a model artifact to recognizable versions of its preprocessing code, dependencies, and configuration. One or more inference workers start and load the artifact. An ingress checks request shape, size, and authorization, then routes the request to the intended model version. A scheduler may run independent requests concurrently or briefly group compatible requests into a batch to use an accelerator more efficiently. After inference, the service applies postprocessing, returns a response, and records latency, errors, throughput, and resource use. Version management should support gradual traffic changes, rollback, and health probes; scaling must account for model load time and memory or accelerator capacity. [NVIDIA Triton’s batching guide](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html) documents dynamic batch scheduling, and [Amazon SageMaker’s inference deployment guide](https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html) shows a managed endpoint deployment and invocation path.

## 一个例子 | A worked example

Suppose a team has trained an email classifier. A client sends one message to an endpoint. The endpoint validates the request fields and size, then uses the same tokenizer as training to turn text into tensors. The running model returns a spam score; postprocessing maps that score to a class and returns JSON. During a traffic peak, independent messages can share an inference batch. If queueing takes too long, however, the service needs a timeout policy rather than waiting without limit. For a new model version, a small share of requests can go to the candidate first. The team compares error rate, latency, and resource use before continuing the rollout or reverting. Offline batch scoring can reuse the artifact and preprocessing contract, but it usually does not promise low latency for each individual request.

## 局限与误解 | Limits and misconceptions

Low latency, high throughput, and low cost can pull in different directions. Larger batches may improve hardware utilization but add queueing and waiting time. More replicas may shorten a queue while increasing fixed costs. Average latency hides slow requests, so teams often track p50 and p95 or higher percentiles alongside timeouts, errors, and throughput. A stable endpoint does not imply correct predictions; task evaluation and real feedback must measure model quality. A mismatch between preprocessing and model version can produce plausible but meaningless outputs, and logging raw inputs can expose sensitive data. Cold starts, sudden load, exhausted accelerator memory, downstream network failures, and incompatible updates need separate capacity, alerting, and recovery plans. A deployment platform can manage endpoints, but it cannot define acceptable quality, latency, or privacy boundaries for a team.

## 相关标本 | Related specimens

[Backpropagation](/entries/backpropagation) explains gradient computation during training. [How Language Models Generate](/entries/llm-generation) explains the token loop within one language-model inference, and [AI Evaluation](/entries/ai-evaluation) provides ways to measure task quality before and after deployment. Serving carries an artifact into use; it does not replace training or evaluation.

:::
