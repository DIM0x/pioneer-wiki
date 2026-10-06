:::zh
**反向传播**是在神经网络中高效计算损失对各参数梯度的方法。前向计算先得到预测和损失，反向计算再沿计算图使用链式法则，把输出端的误差信号逐层传回。反向传播本身负责求导；随机梯度下降、Adam 等优化器才使用这些梯度更新权重。本文的博物学对应物是 **Corvus corax**（渡鸦），仅为策展配对。

## 定义与边界 | Definition and boundaries

把网络看作由运算组成的有向图：输入经过矩阵乘法、偏置、激活函数和输出层，产生标量损失 $L$。训练需要知道每个参数微小变化会怎样改变 $L$，也就是计算 $\partial L/\partial W$、$\partial L/\partial b$。如果为每个参数单独重新运行一次模型，代价会很高。反向传播从同一个损失出发，按运算的依赖关系反向复用中间导数，因此适合参数很多、输出损失为标量的网络。它是反向模式自动微分在神经网络中的典型使用方式。

## 工作机制 | How it works

第一步是前向传播：保存各层输入、输出，计算预测和损失。第二步从 $L$ 对输出的导数开始，反向遍历运算节点。若某节点 $u$ 影响下游节点 $v$，链式法则把已有的 $\partial L/\partial v$ 乘上局部导数 $\partial v/\partial u$，并把经过多条路径的贡献相加。对一层仿射变换 $z^\ell=W^\ell a^{\ell-1}+b^\ell$，再接激活 $a^\ell=\sigma(z^\ell)$，局部误差信号会乘上激活函数的导数；参数梯度则由该信号与上一层激活组合得到。最后优化器执行 $W\leftarrow W-\eta\,\partial L/\partial W$。[Rumelhart、Hinton 与 Williams (1986)](https://doi.org/10.1038/323533a0) 展示了用误差反向传播学习内部表示的影响力工作；[自动微分综述](https://jmlr.org/papers/v18/17-468.html) 解释了反向模式与链式求导的一般框架。

## 一个例子 | A worked example

想象一个二维分类器：输入 $(x_1,x_2)$ 经过隐藏层的加权和与非线性激活，再由输出节点给出“属于目标类别”的分数。若正确答案是 1 而模型只给出 0.2，损失就较高。反向过程先求输出分数对损失的影响，再把这份信号分配到输出权重、隐藏层激活和输入权重。一个隐藏节点若提高输出分数，就会收到与它相关的梯度；一个方向相反的权重则可能收到相反符号。梯度把“哪条参数路径造成了多少损失变化”量化出来，但具体往哪走、走多远由优化器和学习率决定。框架如 [PyTorch autograd](https://docs.pytorch.org/docs/stable/notes/autograd.html) 可记录张量运算并自动计算这些导数，使用者仍要提供正确的模型、损失和训练数据。

## 局限与误解 | Limits and misconceptions

反向传播不会判断标签是否合理，也不会保证学到全局最佳参数；它只按给定计算图与损失求局部导数。饱和的激活函数可能让梯度很小；在循环网络等长计算链中，链式法则反复相乘会造成[梯度消失或爆炸](https://d2l.ai/chapter-recurrent-neural-networks/bptt.html)，梯度裁剪可以限制部分爆炸更新，却不构成普遍保证。前向激活通常要为反向计算保留，带来显存开销；检查点、重计算等策略是在时间和内存之间交换。硬性的离散选择或不可微操作没有普通导数，需改写计算、采用近似或使用其他估计方法。还要区分三个步骤：反向传播算梯度，优化器据梯度改参数，评测检查改后的模型是否真的有用。它也不是“大脑如何学习”的直接证明。

## 相关标本 | Related specimens

[感知机](/entries/perceptron)介绍单层线性分类器；本篇解释训练多层网络时如何求导。[大语言模型如何生成](/entries/llm-generation)关注推理阶段的逐 Token 输出，[AI 评测](/entries/ai-evaluation)关注训练后行为证据。反向传播属于训练计算，不是生成策略或质量指标。

:::

:::en
**Backpropagation** is an efficient method for computing the gradient of a neural network’s loss with respect to its parameters. A forward computation produces a prediction and a loss; a backward computation then applies the chain rule through the computation graph to propagate derivative information from the output toward earlier layers. Backpropagation computes derivatives. An optimizer such as stochastic gradient descent or Adam uses those derivatives to change the weights. Its curatorial natural-history counterpart is *Corvus corax*, the common raven; that pairing is only part of the catalogue.

## 定义与边界 | Definition and boundaries

Think of a network as a directed graph of operations. An input passes through matrix multiplications, biases, activation functions, and an output layer to produce a scalar loss $L$. Learning requires knowing how a small parameter change would change that loss: for example, $\partial L/\partial W$ and $\partial L/\partial b$. Re-running the whole model separately for every parameter would be expensive. Backpropagation starts from the same loss and reuses intermediate derivatives in reverse dependency order, making it practical for networks with many parameters and a scalar objective. It is the characteristic use of reverse-mode automatic differentiation in neural-network training. The [automatic differentiation survey by Baydin et al.](https://jmlr.org/papers/v18/17-468.html) describes this general chain-rule framework.

## 工作机制 | How it works

First, the forward pass computes and usually retains the inputs and outputs of each layer, along with the prediction and loss. Next, the backward pass starts with the derivative of the loss with respect to the output and visits the operations in reverse. If a node $u$ affects a downstream node $v$, the chain rule multiplies the existing $\partial L/\partial v$ by the local derivative $\partial v/\partial u$. Contributions are added when multiple paths lead to the same node. For an affine layer $z^\ell=W^\ell a^{\ell-1}+b^\ell$ followed by an activation $a^\ell=\sigma(z^\ell)$, the local error signal is multiplied by the activation derivative; parameter gradients combine that signal with the preceding activations. An optimizer then applies an update such as $W\leftarrow W-\eta\,\partial L/\partial W$. [Rumelhart, Hinton, and Williams (1986)](https://doi.org/10.1038/323533a0) showed how error back-propagation could train internal representations, while frameworks such as [PyTorch autograd](https://docs.pytorch.org/docs/stable/notes/autograd.html) build and differentiate operation graphs automatically.

## 一个例子 | A worked example

Consider a two-dimensional classifier. Its input $(x_1,x_2)$ passes through a weighted hidden layer and a nonlinear activation; an output unit returns a score for the target class. If the correct answer is 1 but the model returns 0.2, the loss is high. The backward pass first measures how the output score affects the loss, then routes derivative contributions to the output weights, the hidden activations, and the input weights. A hidden unit that raises the output score receives a gradient reflecting that influence; a weight with an opposing effect may receive the opposite sign. The gradient quantifies how each parameter path changes the loss. It does not itself choose the step size or decide which direction to take after the calculation; those choices belong to the optimizer and its learning-rate schedule. Autograd tools can perform the bookkeeping, but a person still has to choose an appropriate model, loss, labels, and data.

## 局限与误解 | Limits and misconceptions

Backpropagation cannot judge whether labels are sound, and it does not guarantee a globally best set of parameters. It computes local derivatives for the specified graph and loss. Saturating activations can produce very small gradients; along long computation chains such as recurrent networks, repeated chain-rule products can cause [vanishing or exploding gradients](https://d2l.ai/chapter-recurrent-neural-networks/bptt.html). Gradient clipping can limit some exploding updates but is not a universal guarantee. The forward activations are often retained for the backward pass, which costs memory; checkpointing and recomputation trade additional time for lower memory use. Hard discrete choices and other non-differentiable operations have no ordinary derivative, so a system may need a different formulation, a surrogate, or another estimator. Keep three stages distinct: backpropagation computes gradients, an optimizer changes parameters, and evaluation checks whether the resulting model behaves usefully. It is also not direct evidence for how biological brains learn.

## 相关标本 | Related specimens

[Perceptron](/entries/perceptron) introduces a single-layer linear classifier; this entry explains how gradients are computed when training multilayer networks. [How Language Models Generate](/entries/llm-generation) concerns token-by-token inference, while [AI Evaluation](/entries/ai-evaluation) concerns evidence about behavior after training. Backpropagation is a training computation, not a decoding strategy or a quality metric.

:::
