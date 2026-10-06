import type { Category, EntryTaxonomy, Family } from "@/lib/model/types";

/*
 * The catalogue: seven families (大类), each a real biological family, holding
 * forty-five genera (门类). Names, Latin names and representative entries are
 * copied from the curation package (taxonomy-map.json, schema 1); intros, essays,
 * links and owners are written later by the curators. None of these names has a
 * verified Catalogue of Life snapshot yet, so readers see them as "being verified".
 */

const AT = "2026-10-06T21:00:00+08:00";

const blank = () => ({
  formerSlugs: [],
  intro: { zh: "", en: "" },
  essay: "",
  links: [],
  collaboratorIds: [],
  status: "active" as const,
  createdAt: AT,
  updatedAt: AT,
  version: 1,
});

/** [id, Latin name, 中文科名, 中文, English]; the sort order is the position in the list. */
type FamilyRow = [id: string, latin: string, latinZh: string, zh: string, en: string];
/** [id, Latin genus, representative entry slug, 中文, English]. */
type GenusRow = [id: string, latin: string, representative: string, zh: string, en: string];

const FAMILIES: FamilyRow[] = [
  ["ai", "Corvidae", "鸦科", "人工智能", "Artificial Intelligence"],
  ["software-development", "Rosaceae", "蔷薇科", "软件开发", "Software Development"],
  ["systems-infrastructure", "Desmidiaceae", "鼓藻科", "系统与基础设施", "Systems & Infrastructure"],
  ["data-information", "Sciuridae", "松鼠科", "数据与信息", "Data & Information"],
  ["computing-foundations", "Nymphalidae", "蛱蝶科", "计算基础", "Foundations of Computing"],
  ["security-reliability", "Geoemydidae", "地龟科", "安全与可靠性", "Security & Reliability"],
  ["learning-collaboration", "Cichlidae", "丽鱼科", "学习与协作", "Learning & Collaboration"],
];

const GENERA: Record<string, GenusRow[]> = {
  ai: [
    ["machine-learning", "Aphelocoma", "perceptron", "机器学习", "Machine Learning"],
    ["deep-learning", "Corvus", "backpropagation", "深度学习", "Deep Learning"],
    ["generative-ai", "Pica", "llm-generation", "生成式 AI", "Generative AI"],
    ["agent-architecture", "Garrulus", "agent-architecture", "Agent 架构", "Agent Architecture"],
    ["model-engineering", "Nucifraga", "model-serving", "模型工程", "Model Engineering"],
    ["evaluation-alignment", "Perisoreus", "ai-evaluation", "评测与对齐", "Evaluation & Alignment"],
    ["ai-assisted-development", "Cyanocitta", "ai-assisted-development", "AI 辅助开发", "AI-assisted Development"],
  ],
  "software-development": [
    ["programming-languages", "Rosa", "programming-languages", "编程语言", "Programming Languages"],
    ["frameworks-libraries", "Malus", "frameworks-libraries", "框架与库", "Frameworks & Libraries"],
    ["frontend-development", "Fragaria", "frontend-development", "前端开发", "Frontend Development"],
    ["backend-services", "Prunus", "backend-services", "后端与服务", "Backend & Services"],
    ["testing-debugging", "Potentilla", "testing-debugging", "测试与调试", "Testing & Debugging"],
    ["toolchain-automation", "Rubus", "toolchain-automation", "工具链与自动化", "Toolchains & Automation"],
    ["engineering-practice", "Filipendula", "maintainable-software", "工程实践", "Engineering Practice"],
  ],
  "systems-infrastructure": [
    ["operating-systems", "Cosmarium", "os-kernel", "操作系统", "Operating Systems"],
    ["computer-architecture", "Micrasterias", "memory-hierarchy", "计算机体系结构", "Computer Architecture"],
    ["networks-protocols", "Staurastrum", "tcp-congestion-control", "网络与协议", "Networks & Protocols"],
    ["distributed-systems", "Desmidium", "distributed-systems", "分布式系统", "Distributed Systems"],
    ["cloud-devops", "Xanthidium", "repeatable-deployment", "云与 DevOps", "Cloud & DevOps"],
    ["performance-engineering", "Euastrum", "performance-analysis", "性能工程", "Performance Engineering"],
    ["runtimes-platforms", "Staurodesmus", "garbage-collection", "运行时与平台", "Runtimes & Platforms"],
  ],
  "data-information": [
    ["data-structures", "Sciurus", "data-structures", "数据结构", "Data Structures"],
    ["databases", "Callosciurus", "databases", "数据库", "Databases"],
    ["data-engineering", "Marmota", "data-pipelines", "数据工程", "Data Engineering"],
    ["search-recommendation", "Tamiops", "information-retrieval", "搜索与推荐", "Search & Recommendation"],
    ["knowledge-management", "Funambulus", "knowledge-management", "知识管理", "Knowledge Management"],
    ["data-visualization", "Ratufa", "data-visualization", "数据可视化与表达", "Data Visualization & Communication"],
  ],
  "computing-foundations": [
    ["algorithms", "Vanessa", "algorithm-design", "算法", "Algorithms"],
    ["computing-theory", "Danaus", "finite-automata", "计算理论", "Computing Theory"],
    ["mathematical-foundations", "Morpho", "symmetry-geometry-structure", "数学基础", "Mathematical Foundations"],
    ["compiler-principles", "Heliconius", "compiler", "编译原理", "Compiler Principles"],
    ["formal-methods", "Junonia", "program-invariants", "形式化方法", "Formal Methods"],
    ["computing-models", "Polygonia", "l-system", "计算模型与范式", "Computing Models & Paradigms"],
  ],
  "security-reliability": [
    ["application-security", "Mauremys", "authentication-authorization", "应用安全", "Application Security"],
    ["cryptography", "Batagur", "encryption-hashing-signatures", "密码学", "Cryptography"],
    ["privacy-data-protection", "Cuora", "data-minimization", "隐私与数据保护", "Privacy & Data Protection"],
    ["reliability-engineering", "Cyclemys", "failure-redundancy-recovery", "可靠性工程", "Reliability Engineering"],
    ["observability", "Heosemys", "logs-metrics-traces", "可观测性", "Observability"],
    [
      "security-reliability-practice",
      "Rhinoclemmys",
      "threat-modeling",
      "安全与可靠性实践",
      "Security & Reliability Practice",
    ],
  ],
  "learning-collaboration": [
    ["learning-methods", "Astatotilapia", "effective-learning", "学习方法", "Learning Methods"],
    ["technical-writing", "Julidochromis", "technical-documentation", "技术写作", "Technical Writing"],
    ["knowledge-organization", "Apistogramma", "notes-to-knowledge", "知识整理", "Knowledge Organization"],
    ["team-collaboration", "Neolamprologus", "collaborative-work", "团队协作", "Team Collaboration"],
    ["code-review-feedback", "Pelvicachromis", "effective-code-review", "代码评审与反馈", "Code Review & Feedback"],
    ["technical-exchange", "Laetacara", "technical-discussion", "技术交流", "Technical Exchange"],
  ],
};

export const families: Family[] = FAMILIES.map(([id, scientificName, taxonNameZh, zh, en], i) => ({
  ...blank(),
  id,
  slug: id,
  sortOrder: i + 1,
  scientificName,
  taxonNameZh,
  name: { zh, en },
}));

export const categories: Category[] = families.flatMap((family) =>
  GENERA[family.id].map(([id, scientificName, representativeSlug, zh, en], i) => ({
    ...blank(),
    id,
    slug: id,
    familyId: family.id,
    sortOrder: i + 1,
    scientificName,
    representativeSlug,
    name: { zh, en },
  })),
);

/**
 * Where the existing entries are filed. The species are the curators' choice; the
 * bodies and review states stay as they are until the rewritten articles land.
 */
export const entryTaxonomy: Record<string, EntryTaxonomy> = {
  perceptron: {
    categoryId: "machine-learning",
    auxiliaryCategoryIds: ["algorithms"],
    species: "Aphelocoma coerulescens",
    level: "concept",
    contentRole: "foundation",
  },
  backpropagation: {
    categoryId: "deep-learning",
    auxiliaryCategoryIds: ["algorithms", "machine-learning"],
    species: "Corvus corax",
    level: "concept",
    contentRole: "foundation",
  },
  "os-kernel": {
    categoryId: "operating-systems",
    auxiliaryCategoryIds: ["runtimes-platforms"],
    species: "Cosmarium botrytis",
    level: "concept",
    contentRole: "foundation",
  },
  "memory-hierarchy": {
    categoryId: "computer-architecture",
    auxiliaryCategoryIds: ["performance-engineering"],
    species: "Micrasterias rotata",
    level: "concept",
    contentRole: "foundation",
  },
  "tcp-congestion-control": {
    categoryId: "networks-protocols",
    auxiliaryCategoryIds: ["performance-engineering"],
    species: "Staurastrum paradoxum",
    level: "concept",
    contentRole: "foundation",
  },
  "garbage-collection": {
    categoryId: "runtimes-platforms",
    auxiliaryCategoryIds: ["programming-languages", "performance-engineering"],
    species: "Staurodesmus dejectus",
    level: "concept",
    contentRole: "foundation",
  },
  compiler: {
    categoryId: "compiler-principles",
    auxiliaryCategoryIds: ["programming-languages"],
    species: "Heliconius melpomene",
    level: "concept",
    contentRole: "foundation",
  },
  "l-system": {
    categoryId: "computing-models",
    auxiliaryCategoryIds: ["algorithms"],
    species: "Polygonia c-album",
    level: "concept",
    contentRole: "foundation",
  },
  parser: {
    categoryId: "programming-languages",
    auxiliaryCategoryIds: ["compiler-principles"],
    species: "Rosa canina",
    level: "concept",
    contentRole: "foundation",
  },
  "ant-colony-optimization": {
    categoryId: "algorithms",
    auxiliaryCategoryIds: ["machine-learning"],
    species: "Vanessa atalanta",
    level: "concept",
    contentRole: "foundation",
  },
  "b-tree": {
    categoryId: "data-structures",
    auxiliaryCategoryIds: ["databases"],
    species: "Sciurus carolinensis",
    level: "concept",
    contentRole: "foundation",
  },
  "bloom-filter": {
    categoryId: "data-structures",
    auxiliaryCategoryIds: ["search-recommendation"],
    species: "Sciurus niger",
    level: "concept",
    contentRole: "foundation",
  },
  "cache-line": {
    categoryId: "computer-architecture",
    auxiliaryCategoryIds: ["performance-engineering"],
    species: "Micrasterias denticulata",
    level: "concept",
    contentRole: "foundation",
  },
  "gossip-protocol": {
    categoryId: "distributed-systems",
    auxiliaryCategoryIds: ["networks-protocols"],
    species: "Desmidium baileyi",
    level: "concept",
    contentRole: "foundation",
  },
  paxos: {
    categoryId: "distributed-systems",
    auxiliaryCategoryIds: ["reliability-engineering"],
    species: "Desmidium grevillei",
    level: "concept",
    contentRole: "foundation",
  },
  "raft-consensus": {
    categoryId: "distributed-systems",
    auxiliaryCategoryIds: ["reliability-engineering"],
    species: "Desmidium aptogonum",
    level: "concept",
    contentRole: "foundation",
  },
};
