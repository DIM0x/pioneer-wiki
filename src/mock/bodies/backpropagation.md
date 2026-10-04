:::zh
**反向传播**是计算损失函数对网络每个参数梯度的高效算法。它先前向计算并缓存每一层的输出，再从输出层开始，用链式法则把误差一层层传回去。
:::

:::en
**Backpropagation** computes the gradient of the loss with respect to every parameter efficiently. It runs a forward pass and caches each layer's output, then starts at the output layer and passes the error back layer by layer with the chain rule.
:::

$$
\frac{\partial L}{\partial w^{(l)}} = \delta^{(l)} \, a^{(l-1)\top}, \qquad
\delta^{(l)} = \left(W^{(l+1)\top} \delta^{(l+1)}\right) \odot \sigma'\!\left(z^{(l)}\right)
$$

:::zh
每个参数的梯度只需一次前向、一次反向即可全部得到，代价与前向计算同阶。
:::

:::en
One forward and one backward pass yield every gradient, at a cost of the same order as the forward pass.
:::
<!-- @since 2 -->

## 计算图示例 | A computational-graph example

:::zh
对 $f = (x + y) \cdot z$，取 $x = -2, y = 5, z = -4$：前向得 $q = x + y = 3$，$f = -12$。反向时 $\partial f / \partial z = q = 3$，$\partial f / \partial q = z = -4$，于是 $\partial f / \partial x = \partial f / \partial y = -4$。
:::

:::en
For $f = (x + y) \cdot z$ with $x = -2, y = 5, z = -4$: the forward pass gives $q = x + y = 3$ and $f = -12$. Going back, $\partial f / \partial z = q = 3$ and $\partial f / \partial q = z = -4$, so $\partial f / \partial x = \partial f / \partial y = -4$.
:::
<!-- @end -->
