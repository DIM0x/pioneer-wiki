:::zh
**感知机**是一个用可学习权重把输入映射为类别的线性分类器。弗兰克·罗森布拉特在 1950 年代提出感知机模型，用它研究由简单计算单元组成的学习系统；现代机器学习课程中的单层感知机则通常指一个线性打分器加阈值判决。本文的博物学对应物是 **Aphelocoma coerulescens**（Florida scrub-jay）；这种配对是策展分类，不表示鸟类行为与算法机制有关。

## 定义与边界 | Definition and boundaries

给定特征向量 $x$、权重 $w$ 和偏置 $b$，感知机先计算 $z=w^\top x+b$，再依照阈值输出类别，例如 $z\geq 0$ 时预测为正类，否则为负类。几何上，$w^\top x+b=0$ 是一条直线、一个平面或更高维空间中的超平面；它把输入空间分成两边。这个定义明确了边界：单层感知机能表达线性决策边界，不会自行学习弯曲或分段的复杂边界。

## 工作机制 | How it works

训练需要带标签的例子。采用标签 $y\in\{-1,+1\}$ 时，算法对每个输入作预测；若预测错误，就把权重改为 $w\leftarrow w+\eta yx$，并把偏置改为 $b\leftarrow b+\eta y$，其中 $\eta$ 是学习率。这个更新会把当前例子的打分往正确一侧推。若例子已正确分类，基础感知机规则不更新。罗森布拉特的原始工作描述了以输入刺激和可调权重进行学习的模型；今天常见的线性分类实现与这项历史模型有关，但两者的具体电路解释并不完全相同。

## 一个例子 | A worked example

把两个布尔输入 $x_1,x_2$ 编码为 0 或 1，并令目标为 AND：只有两者同时为 1 才输出 1。取权重 $w_1=w_2=1$，阈值 1.5，四种输入就能被一条直线正确分开。训练时若输入 $(1,0)$ 被误判为正类，更新会降低与该例子相关的正向打分；反复看带标签样本，边界会移动到不再犯这类错误的位置。对 XOR，正例是 $(1,0)$、$(0,1)$，负例是 $(0,0)$、$(1,1)$。若以 0 为决策阈值，两个正例要求 $w_1+b\geq0$ 与 $w_2+b\geq0$，两个负例要求 $b<0$ 与 $w_1+w_2+b<0$。把正例不等式相加得到 $w_1+w_2+2b\geq0$，把负例不等式相加则得到 $w_1+w_2+2b<0$，矛盾。因此单层感知机不能实现 XOR；加入隐藏层后，多个中间边界可组合出这种非线性分类。

## 局限与误解 | Limits and misconceptions

感知机是一个有用的最小模型，不是现代神经网络的完整同义词。它直接给出硬类别判决，通常不提供经过校准的类别概率；若数据带噪、类别重叠或不能线性分开，基础更新也不能把训练错误降至零。输入特征的表示和尺度会改变可学习的边界，训练次序与学习率也会影响过程。把感知机说成“能学习任何模式”忽略了它的表示能力；把它和多层网络混为一谈，则掩盖了隐藏层与非线性带来的表达差别。历史上“感知机”还曾指更广泛的概率模型，因此阅读旧文时应检查作者讨论的是哪一种构造。

## 相关标本 | Related specimens

接下来可读[反向传播](/entries/backpropagation)，理解多层网络如何计算梯度；[大语言模型如何生成](/entries/llm-generation)展示训练完成后模型如何逐 Token 产生文本；[AI 评测](/entries/ai-evaluation)则讨论怎样检验模型在目标任务上的表现。每篇解决的问题不同：表示、优化、生成和评测不能互相替代。

:::

:::en
**Perceptron** is a linear classifier that maps an input to a class using learned weights. Frank Rosenblatt introduced perceptron models in the 1950s while studying learning systems built from simple computational units. In modern machine-learning teaching, a single-layer perceptron usually means a linear score followed by a threshold decision. Its curatorial natural-history counterpart is *Aphelocoma coerulescens*, the Florida scrub-jay; the pairing is a catalogue choice, not a claim that bird behaviour explains an algorithm.

## 定义与边界 | Definition and boundaries

Given a feature vector $x$, weights $w$, and a bias $b$, the perceptron computes $z=w^\top x+b$, then assigns a class according to a threshold: for example, positive when $z\geq0$ and negative otherwise. Geometrically, $w^\top x+b=0$ is a line, plane, or higher-dimensional hyperplane. It divides the input space into two regions. This boundary is the key limitation as well as the key idea: one unit represents a linear decision boundary, not an arbitrary curved or piecewise boundary. Rosenblatt’s original account is a historical source for the model; the current [scikit-learn Perceptron reference](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Perceptron.html) documents a modern linear classifier with the same family name.

## 工作机制 | How it works

Training uses examples with labels. With labels $y\in\{-1,+1\}$, the algorithm predicts a class and updates only after a mistake: $w\leftarrow w+\eta yx$ and $b\leftarrow b+\eta y$, where $\eta$ is the learning rate. The change pushes the score for that example toward the correct side of the boundary. A correctly classified example causes no update under the basic rule. This is a mistake-driven learning procedure, not gradient descent on a smooth probability model. The [original paper by Rosenblatt (1958)](https://doi.org/10.1037/h0042519) describes learning through adjustable connections and input stimulation, although its broader probabilistic model should not be read as identical to every modern software implementation.

## 一个例子 | A worked example

Encode two Boolean inputs $x_1,x_2$ as zero or one and let the target be AND: the output is one only when both inputs are one. Weights $w_1=w_2=1$ and a threshold of 1.5 separate all four cases with a single line. During training, if $(1,0)$ is incorrectly labelled positive, an update lowers the positive score associated with that example. Repeated updates move the boundary until examples of this form fall on the negative side. XOR is different: its positive points are $(1,0)$ and $(0,1)$, while $(0,0)$ and $(1,1)$ are negative. Suppose a single threshold unit separates them at score zero. The positive cases require $w_1+b\geq0$ and $w_2+b\geq0$; the negative cases require $b<0$ and $w_1+w_2+b<0$. Adding the positive inequalities gives $w_1+w_2+2b\geq0$, while adding the negative inequalities gives $w_1+w_2+2b<0$, a contradiction. Thus no single line separates the sets and a single-layer perceptron cannot implement XOR. Hidden units let a multilayer network combine intermediate boundaries and overcome this representation limit. Minsky and Papert’s *Perceptrons* is cited as a historical treatment; the publisher listing is bibliographic, while the result here is established directly by the inequalities ([MIT Press edition](https://mitpress.mit.edu/9780262631112/perceptrons/)).

## 局限与误解 | Limits and misconceptions

The perceptron is a useful minimal model, not a synonym for a modern neural network. Its hard decision normally does not provide a calibrated class probability. When classes overlap or the data are not linearly separable, the basic update cannot make every training example correct; a finite training run can still stop after a chosen number of passes, but that does not remove the limitation. Feature representation and scale affect the boundary the model can express, while sample order and learning rate affect the training path. Saying that a perceptron can “learn any pattern” ignores its representational capacity. Treating it as equivalent to a multilayer network hides the role of hidden units and nonlinear transformations. Historical sources also use “perceptron” for broader probabilistic constructions, so readers should check which model an author means.

## 相关标本 | Related specimens

Read [Backpropagation](/entries/backpropagation) to see how multilayer networks compute gradients. [How Language Models Generate](/entries/llm-generation) explains how a trained model produces text token by token, and [AI Evaluation](/entries/ai-evaluation) asks whether a model performs the intended task. Representation, optimization, generation, and evaluation answer different questions and cannot substitute for one another.

:::
