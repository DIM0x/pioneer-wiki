:::zh
**蚁群优化**（ACO）是一类群体式随机元启发法：多个构造解的人工代理依据局部启发信息与共享信息素，逐步生成候选解，再通过反馈改变后续搜索倾向。它适用于难以直接求精确最优解的组合优化问题。目录将本文配对到 **Vanessa atalanta**（Vanessa 属）；这是策展分类，算法借用了“蚁群”的名称，并不代表红蛱蝶具有此处描述的行为或算法。

## 定义与边界 | Definition and boundaries

应用 ACO 时，先把问题编码成图或其他可逐步构造的决策空间，定义可行解、目标函数和约束。人工蚂蚁不是现实昆虫，而是按概率规则构造解的软件过程。每个分量（如边）带有信息素值 $\tau_{ij}$；启发值 $\eta_{ij}$ 表示当前局部线索有多理想。路线问题常令 $\eta_{ij}=1/d_{ij}$，其中 $d_{ij}$ 为边长。Marco Dorigo 的 [Scholarpedia 综述](http://www.scholarpedia.org/article/Ant_colony_optimization)将 ACO 定义为寻找困难优化问题近似解的群体式元启发法，并介绍解的随机逐步构造及信息素模型；作者实验室的[公开软件目录](https://iridia.ulb.ac.be/~mdorigo/ACO/aco-code/public-software.html)列出面向对称旅行商问题的 Ant System、Ant Colony System 和 MAX–MIN Ant System 实现。定义解编码时不要与自然界蚂蚁的取食机制混为一谈。

## 工作机制 | How it works

一只蚂蚁在当前位置 $i$ 的可选邻居集合 $N_i$ 中选择下一步，典型规则为 $p_{ij}=\tau_{ij}^{\alpha}\eta_{ij}^{\beta}/\sum_{l\in N_i}\tau_{il}^{\alpha}\eta_{il}^{\beta}$。参数 $\alpha$ 控制既有信息素的影响，$\beta$ 控制启发值的影响；较大权重会更偏向历史上常用或当前看似较好的边。所有代理构造完解后，系统蒸发信息素并强化选中解中的分量。常见更新写为 $\tau_{ij}\leftarrow(1-\rho)\tau_{ij}+\Delta\tau_{ij}$，其中 $0<\rho\le1$ 是蒸发率，$\Delta\tau_{ij}$ 由解的质量和更新策略决定。蒸发会逐渐减弱旧痕迹，减少早期选择永久支配搜索的风险；它不保证避免停滞。精英解更新、局部搜索、候选集和信息素上下界是不同变体采用的机制，不能将所有 ACO 实现视为同一算法。

## 一个例子 | A worked example

设四个城市 A、B、C、D 要走一圈，边长分别由距离矩阵给定。每只人工蚂蚁从城市出发，维护尚未访问的城市集合；在当前城市按上述概率选择一条允许的边，直到构成完整回路。若一条路距离短，取 $\eta=1/d$ 时它在构造阶段更有吸引力；完整路线越短，更新策略通常给予路线所含边更多信息素。接着蒸发所有边上的部分信息素，再开始下一轮。若 A–C 被许多高质量回路反复使用，其概率会上升；但若早期偶然偏向很差的通道，蒸发和随机探索也让其他边有机会重新参与。运行若干轮后返回发现的最佳回路，并记录轮数、目标值和随机种子，以便复现比较。

## 局限与误解 | Limits and misconceptions

ACO 是启发式搜索，不因名称或信息素更新便保证找到全局最优解。结果会受图编码、启发函数、参数、初始化、停止规则和随机种子影响。正反馈可能使搜索过早集中，蒸发率过高又可能抹去有用历史；群体规模和局部搜索也带来计算开销。城市规模增长时，完整路线组合数快速增加，算法需要用多轮候选解换取搜索机会。公平比较应在同一问题实例和预算下运行多次，并报告最好、均值、离散程度、运行时间及停止条件，而非只展示一次成功路线。ACO 适合探索可行近似解，不自动替代针对特定问题的精确算法、下界证明或领域约束建模。

## 相关标本 | Related specimens

[算法设计](/entries/algorithm-design)说明如何区分精确算法、复杂度和启发式结果；[有限自动机](/entries/finite-automata)展示显式状态转移模型；[对称、几何与结构](/entries/symmetry-geometry-structure)可帮助理解路线图上的群对称及其对重复搜索的影响。
:::

:::en
**Ant Colony Optimization** (ACO) is a population-based stochastic metaheuristic. Multiple artificial agents incrementally construct candidate solutions using local heuristic information and shared pheromone values, then feed solution quality back into later search. It is used for combinatorial problems where finding an exact optimum is difficult. The catalogue pairs this entry with **Vanessa atalanta** in genus *Vanessa*. The pairing is curatorial: the algorithm borrows a colony metaphor and does not claim that the red admiral butterfly behaves according to the algorithm described here.

## 定义与边界 | Definition and boundaries

An ACO application first encodes a problem as a graph or another decision space in which a solution can be built step by step, then defines feasible solutions, an objective function, and constraints. An artificial ant is a software process, not a real insect. Each component, such as an edge, has a pheromone value $\tau_{ij}$. A heuristic value $\eta_{ij}$ represents the local desirability of a choice; for a route problem it is often set to $1/d_{ij}$, where $d_{ij}$ is the edge length. Marco Dorigo’s [Scholarpedia overview](http://www.scholarpedia.org/article/Ant_colony_optimization) defines ACO as a population-based metaheuristic for approximate solutions to difficult optimization problems and describes stochastic, incremental construction guided by a pheromone model. The author’s laboratory [public software catalogue](https://iridia.ulb.ac.be/~mdorigo/ACO/aco-code/public-software.html) lists implementations of Ant System, Ant Colony System, and MAX–MIN Ant System for the symmetric travelling-salesman problem. The encoding should not be confused with the foraging mechanisms of natural ants.

## 工作机制 | How it works

At current location $i$, an ant chooses among allowed neighbours $N_i$ using a rule such as $p_{ij}=\tau_{ij}^{\alpha}\eta_{ij}^{\beta}/\sum_{l\in N_i}\tau_{il}^{\alpha}\eta_{il}^{\beta}$. Parameter $\alpha$ controls the influence of existing pheromone and $\beta$ controls local heuristic influence. Larger weights favour edges that were used often or currently appear attractive. After agents construct solutions, the system evaporates pheromone and reinforces components in selected solutions. A common update is $\tau_{ij}\leftarrow(1-\rho)\tau_{ij}+\Delta\tau_{ij}$, where $0<\rho\le1$ is the evaporation rate and $\Delta\tau_{ij}$ depends on solution quality and the update strategy. Evaporation gradually weakens old trails and reduces the chance that early choices dominate forever; it does not guarantee that search will avoid stagnation. Elite-solution updates, local search, candidate lists, and pheromone bounds are mechanisms used by different variants, so not every ACO implementation is the same algorithm.

## 一个例子 | A worked example

Suppose four cities, A, B, C, and D, must be visited in a closed tour, with edge lengths given by a distance matrix. Each artificial ant starts at a city and tracks the set of unvisited cities. It chooses an allowed next edge according to the probability rule until it completes a tour. If an edge is short, using $\eta=1/d$ makes it more attractive during construction. Under common update strategies, a shorter complete tour deposits more pheromone on the edges it contains. The system then evaporates some pheromone on every edge before the next iteration. If A–C appears repeatedly in high-quality tours, its selection probability tends to rise. If early tours happen to favour a poor route, evaporation and stochastic exploration still give other edges a chance to re-enter the search. After a chosen number of rounds, the algorithm returns the best tour found and records the iteration count, objective value, and random seed for reproducible comparison.

## 局限与误解 | Limits and misconceptions

ACO is a heuristic search; neither its name nor its pheromone update guarantees a global optimum. Results depend on the graph encoding, heuristic, parameters, initialization, stopping rule, and random seed. Positive feedback can concentrate search too early, while excessive evaporation can erase useful history. Population size and local search also add computational cost. As the number of cities grows, the number of possible tours rises rapidly, so the algorithm trades repeated candidate construction for opportunities to explore the space. A fair comparison runs several trials on the same instances and budget and reports the best value, mean, variation, runtime, and stopping conditions instead of one successful route. ACO can explore feasible approximate solutions; it does not automatically replace a problem-specific exact algorithm, a lower-bound proof, or careful modelling of domain constraints.

## 相关标本 | Related specimens

[Algorithm Design](/entries/algorithm-design) distinguishes exact methods, complexity, and heuristic results. [Finite Automata](/entries/finite-automata) presents an explicit state-transition model. [Symmetry, Geometry and Structure](/entries/symmetry-geometry-structure) can help explain graph symmetries and their effect on redundant route search.
:::
