:::zh
**对称、几何与结构**从一个可检验的问题出发：哪些变换作用于对象后，哪些性质仍然不变？这里的“结构”不只是外观相似，而是对象、关系与允许变换共同组成的数学模型。策展目录将本文对应到 **Morpho menelaus**（Morpho 属）；它只是分类配对，不暗示蝴蝶形态能够证明群论命题。

## 定义与边界 | Definition and boundaries

几何对称可以看作保持所选结构的变换。若对象是欧氏平面中的图形，常见变换包括旋转和反射；若关注更一般的数学对象，“保持”则要由对象的关系、度量或运算明确规定。群作用把这一想法形式化：群中的每个元素都对应一个作用，对单位元和变换复合满足一致规则。[MathWorld 对群作用的定义](https://mathworld.wolfram.com/GroupAction.html)说明，群作用可以把元素送到新的位置，复合作用对应群元素相乘；对一个点可能到达的所有位置称为轨道。对象的对称群由保持该对象的变换组成，[MathWorld 的对称群条目](https://mathworld.wolfram.com/SymmetryGroup.html)以旋转、反射等保形操作概括这一点。关键在于先声明对象与不变量，不能脱离模型笼统谈“有对称”。

## 工作机制 | How it works

分析时先选定变换集合，再检查两件事：每种变换是否保持所关心的性质，变换复合后是否仍在集合内。若成立，群结构使局部操作可以系统地组合。轨道把可互相变换的位置归成一类；稳定子则记录哪些变换固定某一点。对称因此不仅能描述图案，也能减少分类工作：若两个位置位于同一轨道，在当前作用下它们具有相同的结构角色。几何中的距离、角度、邻接关系或方向是否要保持，取决于问题；选不同的不变量，得到的对称群也可能不同。

## 一个例子 | A worked example

正方形的四个顶点记作 0、1、2、3。保持正方形整体的旋转有四种，反射也有四种，合计八个变换，构成二面体群。若作用在顶点上，任意顶点都能经旋转到达其余三个，所以四个顶点构成同一个轨道；固定一个顶点的变换只有恒等变换和穿过该顶点及其对角顶点的反射。这个例子说明，同一图形可同时从整体变换、点的轨道和稳定子三个层次描述。若把某个顶点涂成红色，原有保持涂色的变换会减少；几何对象和附加标记组成了新的结构，不能仍照搬未标记正方形的对称群。

## 局限与误解 | Limits and misconceptions

“看起来相似”不等于数学对称。镜像是否算同一对象、尺度变化是否允许、颜色或方向是否属于结构，都由建模选择决定。实测图像有噪声时，严格相等的对称通常不存在；若改用近似不变量或容差，就得到另一个分析问题，必须明确误差范围。另一个常见误解是把群的记号当作解释：写出 $D_4$ 仍需说明它如何作用、保持什么以及轨道代表什么。对称可压缩描述，也可能掩盖边界条件；带有缺口、标签或环境约束的对象未必保留理想图形的全部变换。

## 相关标本 | Related specimens

[算法设计](/entries/algorithm-design)讨论如何利用不变量证明步骤正确；[有限自动机](/entries/finite-automata)展示有限状态下的等价分类；[L-System](/entries/l-system)则把递归生成的形态与几何解释连接起来。
:::

:::en
**Symmetry, Geometry and Structure** starts with a testable question: which transformations can act on an object, and which properties remain unchanged? “Structure” here is more than visual resemblance; it is a mathematical model made from objects, relations, and permitted transformations. The catalogue’s curatorial pairing is **Morpho menelaus** in genus *Morpho*. It is an index assignment, not evidence that a butterfly’s form proves a group-theoretic statement.

## 定义与边界 | Definition and boundaries

A geometric symmetry can be treated as a transformation that preserves a chosen structure. For a figure in the Euclidean plane, common transformations include rotations and reflections. For a more general mathematical object, preservation must be defined in terms of its relations, metric, or operations. A group action formalizes the idea: each group element acts on the object, and the action follows consistent rules for the identity and composition. [MathWorld’s definition of a group action](https://mathworld.wolfram.com/GroupAction.html) explains that an action moves elements to new positions, composition of actions corresponds to multiplication in the group, and the positions reachable from one point form its orbit. The symmetry group consists of transformations that preserve the object; [MathWorld’s symmetry-group entry](https://mathworld.wolfram.com/SymmetryGroup.html) describes such operations through examples including rotations and reflections. The object and its invariants must be stated before claiming that it has a symmetry.

## 工作机制 | How it works

An analysis first chooses a collection of transformations and then checks two properties: each transformation preserves the feature of interest, and composing permitted transformations keeps the result in the collection. When those conditions hold, the group structure organizes how local operations combine. An orbit groups positions that can be transformed into one another; a stabilizer records which transformations leave a particular position fixed. This provides a way to classify patterns: positions in the same orbit have the same structural role under the chosen action. Which features must remain fixed—distance, angle, adjacency, or orientation—depends on the question. Changing the preserved features can produce a different symmetry group for the same underlying figure.

## 一个例子 | A worked example

Label the four vertices of a square 0, 1, 2, and 3. Four rotations and four reflections preserve the unmarked square, giving eight transformations that form the dihedral group. Acting on its vertices, rotations can carry any vertex to each of the other three, so all four vertices lie in one orbit. Only two transformations fix a chosen vertex: the identity and the reflection across the diagonal through that vertex and its opposite. The same figure can therefore be described at three levels: whole-object transformations, a vertex’s orbit, and its stabilizer. If one vertex is painted red, fewer transformations preserve the marked object. The figure plus its annotation is a new structure, so the full symmetry group of the unmarked square no longer applies.

## 局限与误解 | Limits and misconceptions

Visual resemblance is not itself a mathematical symmetry. Whether reflections identify the same object, scaling is allowed, or colour and orientation count as part of the structure depends on the model. Real measurements also contain noise, so exact symmetries may disappear in observed data. Replacing exact preservation with approximate invariants or a tolerance creates a different analysis problem and requires an explicit error bound. Another common mistake is to treat a group symbol as an explanation: writing $D_4$ still leaves the action, preserved feature, and meaning of each orbit to be stated. Symmetry can compress a description, but it can also hide boundary conditions. A notch, label, or environmental constraint may remove transformations that an idealized figure would allow.

## 相关标本 | Related specimens

[Algorithm Design](/entries/algorithm-design) uses invariants to justify steps. [Finite Automata](/entries/finite-automata) shows equivalence classes within a finite state space. [L-Systems](/entries/l-system) connects recursively generated forms with geometric interpretation.
:::
