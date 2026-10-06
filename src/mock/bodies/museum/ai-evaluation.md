:::zh
**AI 评测**是为明确任务收集可重复证据，判断模型或系统是否达到预期质量，并识别在哪些条件下失败。它不等于给模型一个总分：任务、数据、指标、运行设置和判定规则共同决定分数能支持什么结论。本文的博物学对应物是 **Perisoreus canadensis**（加拿大松鸦），仅为策展配对。

## 定义与边界 | Definition and boundaries

一次评测应明确被测对象（模型、提示词、工具、版本或完整产品）、使用场景、目标人群、输入输出以及成功标准。测试集上的结果、离线基准、人工盲评和线上监测回答不同问题，不能直接互换。风险管理也贯穿部署前后；[NIST AI 风险管理框架](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)用 Govern、Map、Measure、Manage 四项功能组织治理与测量。语言模型的 [HELM 评测](https://arxiv.org/abs/2211.09110)展示了任务场景与多指标并用的做法，而非以单一准确率代表全面能力。

## 工作机制 | How it works

先把目标写成可观测任务，再抽取或构造覆盖真实输入分布的数据，明确训练数据是否与评测集隔离。之后选择与任务相符的指标：分类可以看精确率、召回率和混淆矩阵；结构化抽取可测字段级正确率；生成任务可能需要事实依据、完整性、安全性或人工量表。协议还应固定模型版本、提示、温度、工具和重试规则。报告总体结果之外，要按语言、输入长度、类别、用户群体或风险情境分层，并保留可复现的失败样例。若比较两个版本，可对同一输入配对运行，检查差异和不确定性。HELM 的研究在核心场景中尽可能同时测量准确性、校准、鲁棒性、公平性、偏差、毒性和效率，展示单项指标遗漏的信息。

## 一个例子 | A worked example

评测一个基于内部手册回答支持问题的系统时，可建立含标准答案和证据段落的测试集。分别测量答案是否解决问题、关键事实是否能由引用段落支持、系统在资料缺失时是否承认不知道，以及引用是否指向正确文本。一个回答即使措辞流畅、整体评分较高，也可能在关键账户政策问题上编造细节，因此需要单独查看严重失败类型。让另一个语言模型当裁判能扩大开放式比较规模，但不能把裁判分数视作客观真值。[MT-Bench 与 Chatbot Arena 研究](https://arxiv.org/abs/2306.05685)报告了 LLM 裁判与人工偏好的相当一致性，同时分析了位置、冗长和自我偏好等偏差。

## 局限与误解 | Limits and misconceptions

评测集只是目标使用情境的有限样本。训练数据泄漏或基准污染可能让模型熟悉答案而非掌握目标能力；分布变化也会使旧分数失效。平均分会掩盖少数群体或罕见高风险输入上的失败，复合指标则可能把质量、安全和延迟冲突压成一个难解释的数值。人工标注会有分歧，模型裁判会有偏差，自动指标也可能被优化目标钻空子。单次结果还受到抽样误差和运行随机性的影响。好的评测不是一次性的排行榜，而是带版本、分层、失败分析和线上回看机制的证据链。分数只能说明它实际测量了什么，不能自动证明现实世界中全面安全、准确或公平。

## 相关标本 | Related specimens

[大语言模型如何生成](/entries/llm-generation)解释输出的逐 Token 机制；[Agent 架构](/entries/agent-architecture)说明评测对象可能包含工具和状态循环；[模型服务](/entries/model-serving)则涉及上线后的延迟、错误与负载监测。明确系统边界，才能选对评测方法。

:::

:::en
**AI evaluation** collects repeatable evidence for a defined task to judge whether a model or system meets an intended quality bar and to identify conditions in which it fails. It is not a single score attached to a model: the task, data, metrics, runtime settings, and decision rules determine what a result can support. Its curatorial natural-history counterpart is *Perisoreus canadensis*, the Canada jay; the pairing is only part of the catalogue.

## 定义与边界 | Definition and boundaries

An evaluation should state what is being evaluated (a model, prompt, tool, version, or complete product), the use case, intended users, inputs and outputs, and success criteria. A test set, offline benchmark, blind human review, and production monitoring answer different questions and are not interchangeable. Risk management also spans development and deployment. The [NIST AI Risk Management Framework](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) organizes its work around Govern, Map, Measure, and Manage functions. The [HELM evaluation](https://arxiv.org/abs/2211.09110) illustrates why language models should be measured across scenarios and metrics instead of being represented by one accuracy number.

## 工作机制 | How it works

First, translate the goal into observable tasks. Then sample or construct data that covers intended use, and document whether it is isolated from training data. Select metrics that match the task: classification can use precision, recall, and a confusion matrix; structured extraction can use field-level correctness; generated answers may need measures of factual support, completeness, safety, or a human rubric. Fix model version, prompt, temperature, tools, and retry rules in the protocol. Report overall results, then break them down by language, input length, class, user group, or risk condition. Keep reproducible failure examples. When comparing two versions, run them on the same inputs and examine the differences and uncertainty. HELM measured accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency across its core scenarios where possible, exposing trade-offs that an accuracy-only report would miss.

## 一个例子 | A worked example

To evaluate a support system that answers questions from internal manuals, build a test set with reference answers and evidence passages. Measure whether each answer resolves the question, whether its important facts are supported by the cited passage, whether the system admits when the material is missing, and whether a citation points to the right text. A fluent answer with a strong aggregate score may still invent details about an important account policy, so severe failure classes need separate review. A second language model can scale open-ended comparisons, but its score is not objective ground truth. The [MT-Bench and Chatbot Arena study](https://arxiv.org/abs/2306.05685) reports substantial agreement between LLM judges and human preferences while also examining position, verbosity, and self-preference biases.

## 局限与误解 | Limits and misconceptions

An evaluation set is only a finite sample of intended use. Training-data leakage or benchmark contamination can reward familiarity with answers rather than the target capability, and a changed distribution can make an old score misleading. Averages hide failures on smaller groups or rare high-risk inputs. Composite metrics may compress conflicts among quality, safety, and latency into a number that is hard to interpret. Human annotators disagree, model judges have biases, and automatic metrics can be exploited by the objective used to tune a system. Sampling error and runtime randomness also affect one-off results. A useful evaluation is therefore not a one-time leaderboard, but a versioned evidence process with slices, failure analysis, and production follow-up. A score supports only the property it measured; it does not automatically prove that a system is safe, accurate, or fair in every real-world setting.

## 相关标本 | Related specimens

[How Language Models Generate](/entries/llm-generation) explains token-by-token output. [Agent Architecture](/entries/agent-architecture) shows how tools and state can become part of the system being tested, while [Model Serving](/entries/model-serving) covers production latency, errors, and load monitoring. Define the system boundary before choosing an evaluation method.

:::
