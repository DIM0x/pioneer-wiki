:::zh
**大语言模型生成**是模型根据已有 Token 序列，反复预测下一个 Token 并把结果接回输入的过程。Token 是分词器定义的文本单位，可能是词、词的一部分、标点或空白，不等于一个完整汉字或单词。许多大型语言模型采用 Transformer 架构，但“语言模型”描述的是根据上下文建模语言的任务，不限定为一种网络结构。本文的博物学对应物是 **Pica pica**（喜鹊），仅作为目录中的策展配对。

## 定义与边界 | Definition and boundaries

在第 $t$ 步，模型根据当前上下文 $x_1,\ldots,x_{t-1}$ 计算词表上各 Token 的条件概率 $P(x_t\mid x_1,\ldots,x_{t-1})$。生成不是一次性写出整段答案，而是把每个新 Token 追加到序列，再进行下一步预测。输入通常经过 Tokenizer 编码，输出 Token 再解码成人类可读文本。[Brown 等人 (2020)](https://proceedings.neurips.cc/paper_files/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html) 描述了自回归语言模型的大规模少样本学习；Transformer 是常见实现之一，其注意力机制见 [Vaswani 等人 (2017)](https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html)。

## 工作机制 | How it works

服务先把提示词、系统指令及可用上下文编码成 Token。模型计算下一个 Token 的 logits，再按解码规则选择候选。贪心解码每步都取最高分 Token；采样会按概率随机抽取。温度 $T$ 在 softmax 前缩放 logits：较低温度会让分布更集中，较高温度通常增加选择多样性，但不会赋予模型新知识。Top-k 限定候选数；top-p（nucleus sampling）保留累计概率达到阈值的最小候选集合后再采样。[Hugging Face 的生成策略文档](https://huggingface.co/docs/transformers/en/generation_strategies)介绍这些解码方式，[Holtzman 等人](https://arxiv.org/abs/1904.09751)比较采样策略并提出 nucleus sampling。选出的 Token 会追加到上下文，循环继续，直到结束 Token、停止序列或输出预算触发停止。分词器的拆分规则决定文本如何占用模型上下文，[Tokenization 指南](https://huggingface.co/docs/transformers/en/tokenizer_summary)说明常见编码方法。

## 一个例子 | A worked example

给模型提示 “The capital of France is”，它可能把 “ Paris” 赋予较高概率，也可能保留其他候选。贪心解码选择当前最高分候选；随机采样则有机会选择较低概率的替代项。假设第一步选出 “ Paris”，新序列变为 “The capital of France is Paris”；第二步模型再预测句号、补充说明或其他 Token。若请求要求 JSON，应用还可以检查输出格式，但格式检查不能证明内容正确。温度、top-p、提示上下文和模型版本都可能改变结果，因此复现一次答案需要记录这些条件，而不是只保存自然语言提示。

## 局限与误解 | Limits and misconceptions

下一个 Token 概率是语言序列的建模目标，不等于“查到事实”的置信度。模型可能生成语法流畅但错误的陈述；提高温度也不会修复事实问题。[NIST 生成式 AI 风险画像](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)将这类生成内容风险纳入风险管理。每一步依赖当前提供的上下文和模型参数，超出上下文窗口的对话只有在应用重新附加、检索或摘要后才会影响预测。采样带来多样性，也带来输出差异；贪心解码则可能重复、僵化。不同 Tokenizer 对同一文本的拆分和长度估算可能不同。系统提示、模型训练与工具接入会影响整体产品行为，但不能据此把模型描述为有独立长期记忆或必然可靠的推理器。关键用途应以来源、测试或人工复核验证生成内容。

## 相关标本 | Related specimens

[感知机](/entries/perceptron)与[反向传播](/entries/backpropagation)介绍分类器和训练时的梯度计算；本篇聚焦训练完成后的文本生成。[Agent 架构](/entries/agent-architecture)说明应用如何把模型接入工具和状态循环，[AI 评测](/entries/ai-evaluation)说明怎样检查不同解码设置下的质量。

:::

:::en
**Large language model generation** is the process of repeatedly predicting a next token from an existing token sequence and appending the selected result to that sequence. A token is a unit defined by a tokenizer; it may be a word, part of a word, punctuation, or whitespace, rather than one complete word or character. Many large language models use Transformer architectures, but “language model” describes a language-prediction task, not one required network structure. Its curatorial natural-history counterpart is *Pica pica*, the Eurasian magpie; the pairing is part of the catalogue.

## 定义与边界 | Definition and boundaries

At step $t$, the model computes a conditional distribution over its vocabulary, $P(x_t\mid x_1,\ldots,x_{t-1})$, given the tokens currently in context. Generation is not a single operation that writes a whole answer. Each selected token is appended, and the model predicts again. A tokenizer encodes the input; a decoder turns output tokens back into readable text. [Brown et al. (2020)](https://proceedings.neurips.cc/paper_files/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html) describe large autoregressive language models in their few-shot study. Transformers are a common implementation; their attention mechanism was introduced by [Vaswani et al. (2017)](https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html).

## 工作机制 | How it works

A service encodes the prompt, system instructions, and available context as tokens. The model produces logits for the next token, and a decoding rule selects among candidates. Greedy decoding chooses the highest-scoring token at each step; sampling draws from a probability distribution. Temperature $T$ rescales logits before softmax: a lower value makes the distribution more concentrated, while a higher value generally makes selections more varied. It does not give the model new knowledge. Top-k limits the candidate count. Top-p, or nucleus sampling, retains the smallest candidate set whose cumulative probability reaches a threshold, then samples from that set. The [Hugging Face generation guide](https://huggingface.co/docs/transformers/en/generation_strategies) documents these strategies, and [Holtzman et al.](https://arxiv.org/abs/1904.09751) compare decoding methods and introduce nucleus sampling. The selected token is appended to context, and the loop continues until an end token, a configured stop sequence, or the output budget ends generation. Tokenizer rules affect how much text fits in the context window; the [tokenizer overview](https://huggingface.co/docs/transformers/en/tokenizer_summary) describes common encoding methods.

## 一个例子 | A worked example

Given the prompt “The capital of France is”, a model may assign a high probability to “ Paris” while retaining other candidates. Greedy decoding picks the current top choice; sampling may choose a lower-probability alternative. If the first selected token is “ Paris”, the model sees the expanded sequence “The capital of France is Paris” before predicting whether to add a period, an explanation, or another token. An application may also require JSON and validate its syntax, but valid syntax does not establish that the contents are true. Temperature, top-p, prompt context, and model version can all affect the result. Reproducing an answer therefore requires recording those conditions, not only the natural-language prompt.

## 局限与误解 | Limits and misconceptions

Next-token probability is an objective for modelling language sequences, not a confidence score that a fact has been looked up. A model can produce fluent but false statements, and raising temperature does not fix factual errors. The [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) includes this kind of generated-content risk in its risk-management guidance. Each step depends on the context supplied to the model and on its parameters. Conversation beyond the context window affects a prediction only if the application reattaches it, retrieves it, or supplies a summary. Sampling creates variation; greedy decoding can be repetitive or rigid. Tokenizers may split and count the same text differently. System prompts, model training, and connected tools all influence a product’s behaviour, but they do not give a model independent, durable memory or guarantee reliable reasoning. Important generated claims need verification against sources, tests, or human review.

## 相关标本 | Related specimens

[Perceptron](/entries/perceptron) and [Backpropagation](/entries/backpropagation) introduce a classifier and gradient computation during training; this entry focuses on text generation after training. [Agent Architecture](/entries/agent-architecture) explains how an application can connect a model to tools and state, while [AI Evaluation](/entries/ai-evaluation) explains how to check quality across tasks and decoding settings.

:::
