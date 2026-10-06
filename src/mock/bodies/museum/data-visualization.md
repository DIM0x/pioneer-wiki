:::zh
**数据可视化**是把数据映射到位置、长度、角度、颜色、形状等视觉通道，让读者能够比较、发现模式并评估不确定性。好的图表保留数据结构和分析边界，选择与问题匹配的编码，并在视觉上突出证据而非装饰。[S1][S2]
:::

:::en
**Data visualization** maps data to visual channels such as position, length, angle, color, and shape so readers can compare values, discover patterns, and assess uncertainty. A good chart preserves the data structure and analytical boundary, chooses encodings that fit the question, and gives evidence visual prominence over decoration. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
先明确变量类型与分析任务：比较类别通常使用共同基线上的长度或位置；展示随时间变化需要保留时间顺序；空间数据则需要合适地图投影和地理尺度。可视化不只是把分析结果“画出来”，因为分箱、截断坐标轴、归一化、缺失值处理和分组方式都会改变读者看到的关系。图表也不自动证明因果关系，因果解释仍依赖研究设计和额外假设。[S1]
:::

:::en
Start with variable types and the analytical task. Comparing categories often benefits from length or position against a shared baseline; showing change over time requires preserving temporal order; spatial data need an appropriate map projection and geographic scale. Visualization is not merely drawing a finished analysis: binning, truncated axes, normalization, missing-value handling, and grouping all change the relationships a reader sees. A chart does not establish causation by itself; causal interpretation still depends on study design and additional assumptions. [S1]
:::

## 工作机制 | How it works

:::zh
数据先被转换成视觉标记，再由通道编码变量。位置和长度通常便于精确比较，面积和颜色明度较难精确估计；色相适合区分类别，但不适合表示连续顺序。设计时应统一单位、标出样本量和不确定区间，说明过滤规则与基线。交互图可以提供筛选和细节，但必须保留可读的默认视图和键盘可访问方式。颜色也不应成为区分系列的唯一线索，以照顾色觉差异和灰度打印。[S1][S2]
:::

:::en
Data become visual marks, and channels encode variables. Position and length generally support precise comparison; area and color lightness are harder to estimate exactly. Hue distinguishes categories but is poor for representing a continuous order. A design should use consistent units, show sample sizes and uncertainty intervals, and document filters and baselines. An interactive chart can offer filtering and detail, but it still needs a readable default view and keyboard accessibility. Color should not be the only cue separating series, which helps readers with color-vision differences and supports grayscale printing. [S1][S2]
:::

:::zh
若要展示分组差异和估计不确定性，可让每组点估计与区间共享同一水平尺度；位置编码便于比较，误差区间则提示估计精度。[S1] 样本量悬殊时应直接标示数量，避免相同大小的标记让小样本看起来与大样本同样可靠。图例、单位和脚注应靠近对应数据，减少读者在图表与说明间来回猜测。
:::

:::en
To show group differences and uncertainty, place each estimate and interval on the same horizontal scale. Position supports comparison, while an interval indicates estimate precision. [S1] When sample sizes differ greatly, label them directly; equal-sized marks should not imply that small and large samples are equally reliable. Keep legends, units, and notes close to the data they describe.
:::

## 一个例子 | A worked example

:::zh
要比较六个地区的年度用水量，可以使用从共同零点开始的水平条形图，并按用量排序；若目标是观察十年趋势，则改用时间折线并标出缺失年份。若各地区人口差异很大，可另外显示人均指标，但应同时明确分母与原始总量，避免把“总用水”问题悄然换成“人均用水”。标注测量误差或置信区间后，读者能看出相近估值是否足以支持排名结论。
:::

:::en
To compare annual water use across six regions, use horizontal bars that share a zero baseline and sort them by value. If the goal is to inspect a decade-long trend, use a time-series line and mark missing years. If population differs greatly, show per-capita use as an additional measure, but state the denominator and retain the total so a question about total water use is not silently replaced by one about per-capita use. Marking measurement error or confidence intervals lets readers see whether close estimates support a meaningful ranking.
:::

## 局限与误解 | Limits and misconceptions

:::zh
3D 饼图、双纵轴和截断柱轴会改变视觉比例，容易夸大差别；平滑曲线可能暗示数据并未支持的连续变化。地图颜色若不校正人口密度和区域面积，会把总量误读成风险。避免误导不只是“用不花哨图表”，还需要说明数据来源、时间范围、排除规则、样本数和不确定性。读者也会受选择性展示和排序影响，交互控件需显示当前过滤条件。可视化能揭示结构与异常，但不能替代统计检验、领域判断和原始数据审计。[S1][S2]
:::

:::en
Three-dimensional pies, dual axes, and truncated bar axes can distort visual proportions and exaggerate differences; a smoothed curve may imply continuity the data do not support. A map that ignores population density or region size can turn totals into a misleading picture of risk. Avoiding distortion requires more than choosing an unflashy chart: state data sources, time range, exclusions, sample size, and uncertainty. Readers are also affected by selective display and ordering, so interactive controls should reveal their active filters. Visualization can expose patterns and anomalies, but it cannot replace statistical tests, domain judgment, or auditing the underlying data. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据管线](/entries/data-pipelines)解释指标如何从原始记录生成；[信息检索](/entries/information-retrieval)讨论结果的排序与呈现；[有效学习](/entries/effective-learning)连接图表阅读、记忆和教学设计。
:::

:::en
[Data Pipelines](/entries/data-pipelines) explains how metrics are produced from raw records. [Information Retrieval](/entries/information-retrieval) discusses ranking and presenting results. [Effective Learning](/entries/effective-learning) connects chart reading with memory and instructional design.
:::

## 参考资料 | References

:::zh
- [S1] Claus O. Wilke，*Fundamentals of Data Visualization*，第 2 章“将数据映射到视觉属性”及第 6 章“数值可视化”。[作者在线教材](https://clauswilke.com/dataviz/aesthetic-mapping.html)
- [S2] W3C，*Web Content Accessibility Guidelines (WCAG) 2.2*，1.4.1 Use of Color。[规范](https://www.w3.org/TR/WCAG22/)
:::

:::en
- [S1] Claus O. Wilke, *Fundamentals of Data Visualization*, Chapter 2, “Visualizing Data: Mapping Data onto Aesthetics,” and Chapter 6, “Visualizing Amounts.” [Author-hosted textbook](https://clauswilke.com/dataviz/aesthetic-mapping.html)
- [S2] W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, Success Criterion 1.4.1, Use of Color. [Specification](https://www.w3.org/TR/WCAG22/)
:::
