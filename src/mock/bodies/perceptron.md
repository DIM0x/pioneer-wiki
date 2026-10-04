:::zh
**感知机**是 Rosenblatt 在 1958 年提出的二分类模型：对输入做加权求和，再与阈值比较。它是第一个能从样本中**学习**权重的神经网络模型。
:::

:::en
The **perceptron**, introduced by Rosenblatt in 1958, is a binary classifier: a weighted sum of the inputs compared against a threshold. It was the first neural model that could **learn** its weights from examples.
:::

## 模型 | The model

$$
\hat{y} = \operatorname{sign}\!\left(\mathbf{w}^\top \mathbf{x} + b\right)
$$

## 学习规则 | The update rule

:::zh
每遇到一个分错的样本 $(\mathbf{x}, y)$，就把权重朝正确方向推一步：
:::

:::en
Whenever a sample $(\mathbf{x}, y)$ is misclassified, nudge the weights towards the right answer:
:::

$$
\mathbf{w} \leftarrow \mathbf{w} + \eta\, y\, \mathbf{x}, \qquad b \leftarrow b + \eta\, y
$$

```python
def train(samples, epochs=10, lr=1.0):
    w, b = [0.0] * len(samples[0][0]), 0.0
    for _ in range(epochs):
        for x, y in samples:  # y ∈ {-1, +1}
            if y * (sum(wi * xi for wi, xi in zip(w, x)) + b) <= 0:
                w = [wi + lr * y * xi for wi, xi in zip(w, x)]
                b += lr * y
    return w, b
```
<!-- @since 2 -->

## 收敛定理 | The convergence theorem

:::zh
若数据线性可分、间隔为 $\gamma$、所有样本满足 $\lVert \mathbf{x} \rVert \le R$，则感知机至多犯 $(R/\gamma)^2$ 次错误后收敛，与样本数量无关。
:::

:::en
If the data are linearly separable with margin $\gamma$ and every sample satisfies $\lVert \mathbf{x} \rVert \le R$, the perceptron converges after at most $(R/\gamma)^2$ mistakes, regardless of how many samples there are.
:::
<!-- @end -->
<!-- @since 3 -->

## 异或与沉寂 | XOR and the quiet years

:::zh
单层感知机无法表示异或：没有一条直线能把 $(0,1),(1,0)$ 与 $(0,0),(1,1)$ 分开。Minsky 与 Papert 在 1969 年的《感知机》中系统阐述了这类局限，此后神经网络研究的经费与关注明显减少。这本书究竟应为那段沉寂承担多少责任，至今仍有争论。
:::

:::en
A single-layer perceptron cannot represent XOR: no straight line separates $(0,1),(1,0)$ from $(0,0),(1,1)$. Minsky and Papert set out such limits in *Perceptrons* (1969), after which funding and attention for neural networks fell sharply. How much of the quiet years the book should be blamed for is still argued.
:::

| $x_1$ | $x_2$ | XOR |
| :-: | :-: | :-: |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |
<!-- @end -->

> 田野笔记：一个神经元只会说“是”或“否”。复杂的判断来自许多神经元的层层叠合。
>
> Field note: a single neuron only says yes or no. Complex judgement comes from many of them, layered.
