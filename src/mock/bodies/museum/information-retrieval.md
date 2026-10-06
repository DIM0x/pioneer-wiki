:::zh
**信息检索**是从大型文档或记录集合中找出与用户信息需求相关内容的过程。搜索系统把文档解析成字段和词项，建立倒排索引，再对查询候选进行匹配与排序。它不同于数据库精确查询：自然语言需求常有词汇变化、歧义和相关性梯度，因此系统通常返回有序结果而非简单的满足/不满足集合。[S1][S2]
:::

:::en
**Information retrieval** finds content relevant to a user's information need within a large collection of documents or records. A search system parses documents into fields and terms, builds an inverted index, then matches and ranks candidates for a query. It differs from an exact database query: natural-language needs involve vocabulary variation, ambiguity, and degrees of relevance, so the system usually returns ranked results rather than a simple set of matches or non-matches. [S1][S2]
:::

## 定义与边界 | Definition and boundaries

:::zh
检索流程一般包括文档获取、规范化、分词或 tokenization、字段处理、索引构建、查询解析、候选检索、排序和结果呈现。倒排索引从词项映射到包含它的文档列表，使系统无需扫描全部文本。词项权重可考虑文档长度和集合中词项稀有程度；BM25 是常用词项匹配排序函数之一。向量检索通过嵌入距离补充语义相似匹配，但“相近”不等于事实相关，常见系统会组合词项和向量候选后再排序。[S1][S2]
:::

:::en
A retrieval pipeline typically includes document ingestion, normalization, tokenization, field handling, index construction, query parsing, candidate retrieval, ranking, and presentation. An inverted index maps a term to the list of documents containing it, avoiding a full scan of all text. Term-weighting schemes may account for document length and how rare a term is across the collection; BM25 is a common lexical-ranking function. Vector retrieval uses embedding distance to add semantic matching, but “nearby” does not mean factually relevant. Many systems combine lexical and vector candidates before reranking. [S1][S2]
:::

## 工作机制 | How it works

:::zh
索引器将文档切分为词项，保存词项到文档 ID 的映射，并可记录出现位置、字段、频率和时间。查询解析器对用户输入采用兼容的分析规则，再从多个字段中查找候选。排序器利用词项匹配、字段权重、文档长度、时间或行为信号计算分值；用户最终看到按分值排序的结果及摘要。系统还需处理拼写纠错、同义词、权限过滤、重复文档与索引更新。每个阶段都可能引入偏差，所以结果相关性要用代表性查询和人工判定样本评估。[S1][S2]
:::

:::en
An indexer tokenizes documents and stores term-to-document-ID mappings, sometimes including positions, fields, frequency, and time. The query parser analyzes user input with compatible rules and searches multiple fields for candidates. A ranker scores candidates using term matches, field weights, document length, time, or behavioral signals. Users then see sorted results and snippets. The system must also handle spelling correction, synonyms, access-control filtering, duplicate documents, and index updates. Each stage can introduce bias, so relevance should be evaluated with representative queries and human judgments. [S1][S2]
:::

## 一个例子 | A worked example

:::zh
在一座技术文档库中，用户搜索“如何降低高延迟下的大文件传输等待”。词项检索可以召回同时包含“大文件”和“传输”的 TCP 指南；BM25 会提高稀有术语覆盖较好的文档。向量搜索可能补充使用“长 RTT”表述的页面。系统合并候选后按标题、正文、更新时间和权限排序，并显示匹配段落。若过滤发生在排序之后，用户可能看到标题或摘要泄露无权查看的内容，因此权限应在结果暴露前受控执行。
:::

:::en
In a technical-documentation collection, a user searches for “how to reduce waiting when transferring large files over a high-latency link.” Lexical retrieval can find a TCP guide containing “large file” and “transfer,” while BM25 raises documents with strong coverage of rarer terms. Vector search may add a page that describes the same problem as “long RTT.” The system merges candidates, ranks by title, body, update time, and permissions, then displays matching passages. If access filtering happens only after ranking, a title or snippet could expose restricted content, so authorization must be enforced before results are revealed.
:::

## 局限与误解 | Limits and misconceptions

:::zh
排序分数不是概率，也不是客观的“真相关度”；BM25 的尺度不能直接跨查询比较。词项检索会漏掉未共享词汇的同义表达，向量检索则可能把语义相近但结论相反的文档排在一起。点击数据容易受位置偏差和曝光影响，训练排序器时需避免把历史排序当真值。索引有更新延迟，权限和删除也必须同步传播。评测应覆盖召回率与排序质量、不同语言和查询类型，并结合人工相关性判断；一个综合分数无法替代对失败案例的检查。[S1][S2]
:::

:::en
A ranking score is neither a probability nor an objective measure of “true relevance”; BM25 scores are not directly comparable across queries. Lexical retrieval misses paraphrases that share no vocabulary, while vector retrieval may rank semantically similar documents with opposite conclusions together. Click data is affected by position and exposure bias, so historical ranking should not be treated as ground truth when training a ranker. Index updates can lag, and permission changes or deletions must propagate as well. Evaluation should cover recall and ranking quality across languages and query types, with human relevance judgments and inspection of failure cases. One aggregate score cannot replace that analysis. [S1][S2]
:::

## 相关条目 | Related entries

:::zh
[数据结构](/entries/data-structures)介绍倒排索引所依赖的映射和列表；[数据库](/entries/databases)处理结构化精确查询；[数据管线](/entries/data-pipelines)负责将新的文档安全、及时地送入索引。
:::

:::en
[Data Structures](/entries/data-structures) introduces the maps and lists behind an inverted index. [Databases](/entries/databases) handle exact structured queries. [Data Pipelines](/entries/data-pipelines) deliver new documents to the index safely and on time.
:::

## 参考资料 | References

:::zh
- [S1] Christopher D. Manning、Prabhakar Raghavan 与 Hinrich Schütze，《Introduction to Information Retrieval》，倒排索引、评分和排序章节。[作者在线教材](https://nlp.stanford.edu/IR-book/html/htmledition/irbook.html)
- [S2] Elasticsearch Reference，Similarity 模块与 BM25 默认相似度说明。[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html)
:::

:::en
- [S1] Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze, *Introduction to Information Retrieval*, chapters on inverted indexes, scoring, and ranking. [Author-hosted textbook](https://nlp.stanford.edu/IR-book/html/htmledition/irbook.html)
- [S2] Elasticsearch Reference, Similarity module and default BM25 similarity. [Official documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html)
:::
