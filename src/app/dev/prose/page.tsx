import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { RunningHead } from "@/components/book/RunningHead";
import { Markdown } from "@/components/markdown/Markdown";

export const metadata: Metadata = { title: "Prose specimen 样张", robots: { index: false } };

/** Every Markdown element the article body supports, in one place — the stable review entry for typography. */
const SPECIMEN = `:::zh
**样张**用来检查正文里每一种元素的排版：段落、\`行内代码\`、[链接](/graph)、脚注[^1]、列表、引用、表格、代码、公式与分隔。
:::

:::en
This **specimen** exercises every element an entry body may contain: paragraphs, \`inline code\`, [links](/graph), footnotes[^1], lists, quotations, tables, code, maths and breaks.
:::

## 列表 | Lists

- 无序列表的项目符号是门类颜色的小种子。
- 第二项，含一段较长的文字，用来检查换行后的悬挂缩进是否与首行文字对齐，而不是与符号对齐。
  - 嵌套一层时，种子变为空心。
  - Nested items keep the same rhythm.

1. 有序列表的编号是活字斜体，悬挂在页边。
2. Second step, with \`code\` inside.
3. 第三步。

- [x] 已完成的任务
- [ ] 尚未完成的任务

## 引用 | Quotation

> 田野笔记：一个神经元只会说"是"或"否"。复杂的判断来自许多神经元的层层叠合。
>
> Field note: a single neuron only says yes or no. Complex judgement comes from many of them, layered.

## 表格 | Table

| 层级 Level | 容量 Size | 时延 Latency |
| --- | ---: | ---: |
| 寄存器 Registers | ~1 KB | 0.3 ns |
| L1 缓存 L1 cache | 64 KB | 1 ns |
| 主存 DRAM | 512 GB | 80 ns |

## 代码 | Code

\`\`\`ts
// The copy button copies exactly this text.
export function gossipRound(peers: Peer[], fanout = 3): void {
  for (const peer of sample(peers, fanout)) exchange(self, peer);
}
\`\`\`

\`\`\`text
no language → labelled "Text"
\`\`\`

---

## 公式 | Maths

$$
p \\approx \\left(1 - e^{-kn/m}\\right)^k
$$

[^1]: 脚注出现在正文末尾，带返回链接。 Footnotes collect at the end with a way back.
`;

export default async function ProseSpecimenPage() {
  const { lang } = await getT();
  return (
    <div data-phylum="theory" className="flex flex-col gap-(--space-block)">
      <RunningHead left="Dev · Prose specimen" right="/dev/prose" />
      <h1 className="font-display text-h1 font-[480] tracking-[-0.02em]">Prose specimen</h1>
      <Markdown lang={lang}>{SPECIMEN}</Markdown>
    </div>
  );
}
