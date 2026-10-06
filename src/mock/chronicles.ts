import type { ChronicleDetail } from "@/lib/model/types";

/*
 * 纪行 fixtures — the society's annals. Every record is a placeholder until the
 * society supplies its real minutes: all of them carry `sample: true`, which
 * stamps "示例 / sample" on the page. Videos and documents are never stored
 * here, only linked to; the addresses below are deliberately example.org so a
 * sample record never points at somebody's real meeting.
 */

export const chronicles: ChronicleDetail[] = [
  {
    id: "ch-0001",
    number: 1,
    date: "2026-06-01",
    kind: "milestone",
    title: { zh: "先锋维基立会", en: "The society is founded" },
    summary: {
      zh: "几个人决定把计算机科学当作一部博物志来编。",
      en: "A few people decide to catalogue computer science as a natural history.",
    },
    hostIds: ["m-qingkong"],
    resources: [
      {
        kind: "link",
        label: { zh: "本会缘起", en: "How the society began" },
        url: "https://example.org/chronicles/2026-06-01-founding",
        note: { zh: "占位链接，等待真实地址。", en: "Placeholder address awaiting the real one." },
      },
    ],
    gallery: [
      {
        assetId: "plate-frontispiece",
        caption: { zh: "卷首：一座彼此相连的小小群落。", en: "Frontispiece: one small, connected community." },
      },
    ],
    tags: ["立会"],
    sample: true,
    body: ":::zh\n六月一日，本会立。当日定下三件事：条目按尺度、角色与关系编目；插图必须说出条目的一件真事；一切修订都留痕。\n\n这份纪行本身也是那次决定的一部分——先把日子记下来，再谈别的。\n:::\n\n:::en\nOn the first of June the society was founded. Three things were settled that day: entries are catalogued by scale, role and relation; an illustration must tell one true thing about its entry; and every revision leaves a trace.\n\nThis register is part of that decision — set the days down first, argue about the rest later.\n:::\n",
  },
  {
    id: "ch-0002",
    number: 2,
    date: "2026-06-08",
    kind: "meeting",
    title: { zh: "第一次例会：确定十门分类", en: "First sitting: settling the ten phyla" },
    summary: {
      zh: "逐条讨论十门分类的边界，并给每门选了一个生物象征。",
      en: "The boundaries of the ten phyla were argued one by one, and each was given an organism.",
    },
    hostIds: ["m-qingkong", "m-sample-b"],
    resources: [
      {
        kind: "video",
        label: { zh: "例会录像", en: "Recording of the sitting" },
        url: "https://example.org/recordings/2026-06-08",
        detail: "1h 38m",
      },
    ],
    gallery: [],
    tags: ["分类", "例会"],
    sample: true,
  },
  {
    id: "ch-0003",
    number: 3,
    date: "2026-06-22",
    kind: "material",
    title: { zh: "条目写作规范讲义", en: "Handout: how to write an entry" },
    summary: {
      zh: "双语标题、摘要与正文的写法，以及来源著录的格式。",
      en: "Bilingual titles, summaries and bodies, and how to cite a source.",
    },
    hostIds: ["m-qingkong"],
    resources: [
      {
        kind: "document",
        label: { zh: "讲义正文", en: "The handout" },
        url: "https://example.org/materials/writing-handout",
        detail: "PDF · 12 pages",
      },
      { kind: "slides", label: { zh: "配套幻灯", en: "Slides" }, url: "https://example.org/materials/writing-slides" },
    ],
    gallery: [],
    tags: ["写作", "规范"],
    sample: true,
  },
  {
    id: "ch-0004",
    number: 4,
    date: "2026-07-06",
    kind: "meeting",
    title: { zh: "第二次例会：选题与分工", en: "Second sitting: subjects and parts" },
    summary: {
      zh: "把待写条目排成一列，各自认领；确定插画与正文同时开工。",
      en: "Pending subjects were queued and claimed; illustration and text start together.",
    },
    hostIds: ["m-qingkong", "m-sample-c"],
    resources: [
      {
        kind: "video",
        label: { zh: "例会录像", en: "Recording of the sitting" },
        url: "https://example.org/recordings/2026-07-06",
        detail: "1h 12m",
      },
    ],
    gallery: [],
    tags: ["例会", "选题"],
    sample: true,
  },
  {
    id: "ch-0005",
    number: 5,
    date: "2026-08-03",
    kind: "archive",
    title: { zh: "首批插画归架", en: "The first plates are filed" },
    summary: {
      zh: "十六件标本图版连同提示词一起归档，版式与许可同时登记。",
      en: "Sixteen specimen plates and their prompts were filed, with format and licence recorded alongside.",
    },
    hostIds: ["m-sample-a"],
    resources: [
      {
        kind: "code",
        label: { zh: "图版清单与提示词", en: "Plate manifest and prompts" },
        url: "https://example.org/archive/plates-manifest",
      },
    ],
    gallery: [
      {
        assetId: "plate-memory-hierarchy",
        caption: {
          zh: "归档如标本柜：浅抽屉在上，深抽屉在下。",
          en: "An archive is a specimen cabinet: shallow drawers above, deep ones below.",
        },
      },
      {
        assetId: "plate-b-tree",
        caption: {
          zh: "压制的枝条：每一片叶子离主干一样远。",
          en: "A pressed twig: every leaf the same distance from the stem.",
        },
      },
    ],
    tags: ["归档", "插图"],
    sample: true,
  },
  {
    id: "ch-0006",
    number: 6,
    date: "2026-09-07",
    kind: "meeting",
    title: { zh: "九月例会：双语校对流程", en: "September sitting: the bilingual proof" },
    summary: {
      zh: "定下中文写、英文校、两边互相指认的流程，并约定标题必须成对。",
      en: "Chinese writes, English proofs, each cites the other; titles must come in pairs.",
    },
    hostIds: ["m-qingkong", "m-sample-d"],
    resources: [
      {
        kind: "video",
        label: { zh: "例会录像", en: "Recording of the sitting" },
        url: "https://example.org/recordings/2026-09-07",
        detail: "2h 05m",
      },
    ],
    gallery: [],
    tags: ["例会", "双语"],
    sample: true,
    body: ":::zh\n校对的规矩只有一条：改英文的时候必须回看中文，改中文的时候必须回看英文。两边若说不到一处，就说明条目还没想清楚。\n:::\n\n:::en\nOne rule governs the proof: whoever changes the English reads the Chinese again, and the other way round. When the two sides cannot be made to agree, the entry is not yet thought through.\n:::\n",
  },
  {
    id: "ch-0007",
    number: 7,
    date: "2026-09-21",
    kind: "material",
    title: { zh: "插图隐喻清单", en: "A list of illustration metaphors" },
    summary: {
      zh: "哪些条目适合用哪种生物或器物作比，附正例与反例。",
      en: "Which entry suits which organism or instrument, with examples good and bad.",
    },
    hostIds: ["m-sample-b", "m-sample-c"],
    resources: [
      {
        kind: "slides",
        label: { zh: "隐喻清单幻灯", en: "Slides: the metaphor list" },
        url: "https://example.org/materials/metaphor-slides",
      },
      {
        kind: "document",
        label: { zh: "反例汇编", en: "Counter-examples" },
        url: "https://example.org/materials/metaphor-counterexamples",
      },
    ],
    gallery: [],
    tags: ["插图", "隐喻"],
    sample: true,
  },
  {
    id: "ch-0008",
    number: 8,
    date: "2026-10-05",
    kind: "meeting",
    title: { zh: "十月例会：纪行立项", en: "October sitting: the annals are proposed" },
    summary: {
      zh: "决定为会史单开一部纪行，例会录像与散页资料都归到此处。",
      en: "A separate register of the society's days was agreed, to hold recordings and loose material alike.",
    },
    hostIds: ["m-qingkong", "m-sample-a", "m-sample-d"],
    resources: [
      {
        kind: "video",
        label: { zh: "例会录像", en: "Recording of the sitting" },
        url: "https://example.org/recordings/2026-10-05",
        detail: "1h 47m",
      },
      {
        kind: "link",
        label: { zh: "纪要（待整理）", en: "Minutes (to be written up)" },
        url: "https://example.org/chronicles/2026-10-05-minutes",
      },
    ],
    gallery: [
      {
        assetId: "plate-paxos",
        caption: {
          zh: "多数一旦朝向一致，群体便有了决定。",
          en: "Once a majority faces one way, the flock has decided.",
        },
      },
    ],
    tags: ["例会", "纪行"],
    sample: true,
  },
];
