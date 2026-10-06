/**
 * Domain model for Pioneer Wiki.
 *
 * These types are the contract between UI, mock data and any future CMS /
 * search / auth backend. Components must depend on these types only — never
 * on the shape of a particular data source.
 */

export type Lang = "zh" | "en";

/** A string that exists in both site languages. */
export type Localized = Record<Lang, string>;

/** ISO-8601 timestamp, e.g. "2026-09-28T10:14:00+08:00". */
export type IsoDate = string;

/** Archive number shown to readers and searchable, e.g. "PW-0007". */
export type EntryId = string;
/** URL segment, e.g. "mycelial-network". */
export type EntrySlug = string;

/**
 * Scale of the subject. The wiki is about computer science, so "macro" means
 * system-level subjects (protocol stacks, kernels, distributed systems) and
 * "micro" means mechanisms and primitives (cache lines, locks, hash functions).
 * Drives node size and the Macro / Micro views.
 */
export type Scale = "macro" | "micro";

/**
 * Ecological role the subject plays in the computing ecosystem:
 * host = platform or runtime others live on (OS kernel, JVM);
 * symbiont = component that coexists with and benefits a host (libraries, protocols);
 * decomposer = breaks structures down (compilers, parsers, garbage collectors);
 * observer = watches and measures (profilers, debuggers, tests, monitoring).
 */
export type BioRole = "host" | "symbiont" | "decomposer" | "observer";

export type DomainId =
  | "algorithms"
  | "theory"
  | "languages"
  | "systems"
  | "architecture"
  | "networking"
  | "distributed"
  | "databases"
  | "ml"
  | "security";

/**
 * Editorial lifecycle. Expressed in the UI as spore (draft) → branching
 * (in review) → full specimen (published), always with a text label.
 */
export type ReviewState = "draft" | "in_review" | "published";

/** How deep an entry goes; one site-wide vocabulary (vocab LEVELS). */
export type ContentLevel = "intro" | "concept" | "practice" | "reference";

/** What an entry is for; one site-wide vocabulary (vocab CONTENT_ROLES). */
export type ContentRole = "foundation" | "method" | "tool" | "case" | "perspective";

// ── Taxonomy: family → genus → species ──────────────────────────────────────

/** 大类 (a real biological family) or 门类 (a real genus inside it). The depth is fixed at two. */
export type TaxonKind = "family" | "category";

/** Taxa are never deleted, only archived; an archived taxon leaves every public listing. */
export type TaxonStatus = "active" | "archived";

/** A related link on a taxon: a site path ("/entries/b-tree") or an http(s) address. */
export interface TaxonLink {
  label: Localized;
  url: string;
}

/** Fields a family and a genus share. Both are curated objects, edited by administrators. */
interface TaxonBase {
  /** Stable key that entries and versions point at; never changes. */
  id: string;
  /** URL segment; may be renamed, and the old one keeps resolving (`formerSlugs`). */
  slug: string;
  formerSlugs: string[];
  /** The technical name readers navigate by, e.g. 人工智能 / Artificial Intelligence. */
  name: Localized;
  /** Accepted Latin name, e.g. "Corvidae" or "Aphelocoma". */
  scientificName: string;
  /** Chinese vernacular name of the taxon, e.g. 鸦科, when the catalogue records one. */
  taxonNameZh?: string;
  /** One line for listings; empty until written. */
  intro: Localized;
  /** Long account, Markdown with :::zh / :::en blocks; empty until written. */
  essay: string;
  /** Cover or badge, an asset id. */
  emblemAssetId?: string;
  links: TaxonLink[];
  /** Author answerable for the taxon. Attribution only: editing rights stay with administrators. */
  leadId?: string;
  collaboratorIds: string[];
  sortOrder: number;
  status: TaxonStatus;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  /** Latest version number; every save, archive, restore or revert adds one. */
  version: number;
}

/** 大类 — a real family, e.g. Corvidae for Artificial Intelligence. */
export type Family = TaxonBase;

/** 门类 — a real genus inside a family, e.g. Aphelocoma for Machine Learning. */
export interface Category extends TaxonBase {
  familyId: string;
  /** The entry that introduces the genus. It may not be published yet; readers only see it once it is. */
  representativeSlug?: EntrySlug;
}

/** One recorded state of a taxon. Restoring an old state appends a new version; none is ever removed. */
export interface TaxonVersion {
  id: string;
  kind: TaxonKind;
  taxonId: string;
  number: number;
  data: Family | Category;
  note: string;
  /** Wiki author who made the change, when the account is bound to one. */
  authorId?: string;
  createdAt: IsoDate;
}

/**
 * A taxon checked against Catalogue of Life (primary) and cross-checked in GBIF
 * and NCBI, frozen when it was published. The site never asks those services at
 * run time; a name without a snapshot is still being verified.
 */
export interface TaxonSnapshot {
  scientificName: string;
  rank: "family" | "genus" | "species";
  acceptedName: string;
  /** Naming authority, e.g. "(Bosc, 1795)". */
  authority: string;
  synonyms: string[];
  sources: Array<{ catalogue: "col" | "gbif" | "ncbi"; id: string; url: string; accessedAt: IsoDate }>;
  verifiedAt: IsoDate;
}

export type RelationKind =
  | "symbiosis" // 共生
  | "source" // 来源
  | "taxonomy" // 分类
  | "contrast" // 对照
  | "dependency" // 依赖
  | "dispute"; // 争议

export interface Author {
  id: string;
  handle: string;
  name: Localized;
  affiliation?: Localized;
  role: "editor" | "contributor" | "reviewer";
  /** Seed for the procedural ink sigil used instead of a photo avatar. */
  sigil: string;
}

/** The authenticated account, which may exist before it is bound to a wiki author. */
export interface Account {
  id: string;
  email: string;
  handle: string;
  name: Localized;
  sigil: string;
  role: "reader" | "admin";
  emailVerified: boolean;
  authorId?: string;
}

export interface Source {
  id: string;
  kind: "book" | "paper" | "archive" | "web" | "specimen";
  title: string;
  creators: string;
  year: number;
  publisher?: string;
  url?: string;
  /** Free-form locator: page, plate number, accession number… */
  locator?: string;
}

export interface Tag {
  id: string;
  label: Localized;
}

export interface Asset {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: Localized;
  caption?: Localized;
  /** Who made the image. Required: no asset without attribution. */
  credit: string;
  license: string;
  sourceUrl?: string;
}

/** Directed edge between two entries. */
export interface Relation {
  id: string;
  from: EntryId;
  to: EntryId;
  kind: RelationKind;
  note?: Localized;
  /** 1 = incidental, 3 = defining. Controls line weight. */
  strength: 1 | 2 | 3;
}

/**
 * Where an entry sits in the catalogue. It belongs to the revision: a draft can
 * refile an entry, and readers see the new place only once that revision is published.
 */
export interface EntryTaxonomy {
  /** The one genus the entry is filed under; its family follows from the genus. */
  categoryId: string;
  /** Other genera that list it as a cross-genus reference. They never change its family, genus or species. */
  auxiliaryCategoryIds: string[];
  /** Scientific name of the species the entry stands for, inside its genus, e.g. "Desmidium aptogonum". */
  species?: string;
  level: ContentLevel;
  contentRole: ContentRole;
}

/** Metadata edited alongside an entry body. Pending names remain in the draft until review. */
export interface EntryMetadata extends Partial<EntryTaxonomy> {
  scale: Scale;
  role: BioRole;
  analogue?: { name: Localized; note?: Localized };
  contributorIds: string[];
  sourceIds: string[];
  tagIds: string[];
  relationDrafts: Array<Pick<Relation, "to" | "kind" | "strength" | "note">>;
  heroAssetId?: string;
  pendingSources: string[];
  pendingTags: string[];
}

export interface Revision {
  id: string;
  entryId: EntryId;
  /** Monotonic per entry; rendered as a growth ring ("ring 7"). */
  number: number;
  parentId?: string;
  authorId: string;
  createdAt: IsoDate;
  /** Edit note written by the author, in whichever language they used. */
  note: string;
  state: ReviewState;
  /** Line-level change counts against the parent revision. */
  stats: { added: number; removed: number };
  /** Where this revision files the entry; it becomes the public place when the revision is published. */
  taxonomy?: EntryTaxonomy;
}

/** Metadata of an entry, without the (potentially large) Markdown body. Taxonomy fields are the published ones. */
export interface EntrySummary extends EntryTaxonomy {
  id: EntryId;
  slug: EntrySlug;
  title: Localized;
  /**
   * Biological counterpart of a computing idea (gossip protocol ↔ mycelial
   * network). Entries that have one are the cross-disciplinary nodes on the map.
   */
  analogue?: { name: Localized; note?: Localized };
  summary: Localized;
  /**
   * @deprecated One of the ten phyla before the family → genus catalogue. Kept for
   * entries that had one, so older clients and rollbacks keep working; new entries have none.
   */
  domain?: DomainId;
  scale: Scale;
  role: BioRole;
  status: ReviewState;
  authorId: string;
  contributorIds: string[];
  sourceIds: string[];
  tagIds: string[];
  /** Languages the body is written in. */
  bodyLanguages: Lang[];
  heroAssetId?: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  /** Number of the revision currently shown to readers. */
  revision: number;
  featured?: boolean;
}

export interface Entry extends EntrySummary {
  /** Markdown (GFM + math + footnotes + `:::zh` / `:::en` bilingual blocks). */
  body: string;
}

// ── Community: the parts beside the wiki ────────────────────────────────────

/** 友链 — a friend site, catalogued like a port in an atlas gazetteer. */
export interface FriendLink {
  id: string;
  name: Localized;
  url: string;
  description: Localized;
  /** Geography vignette drawn beside it (public/vignettes/geo-*). */
  emblem: string;
  since: IsoDate;
  /** Placeholder data until the real list is supplied. */
  sample?: boolean;
}

/** One of the 19th-century printing inks a member's bookplate and page are printed in (vocab INKS). */
export type InkId = "prussian" | "madder" | "sepia" | "verdigris" | "vermilion" | "violet" | "lampblack" | "ochre";
/** A bookplate border (vocab BORDERS). */
export type BorderId = "vine" | "meander" | "rope" | "fleuron";

/** 藏书票 Ex libris — each member's personal mark. */
export interface Bookplate {
  /** Plate number, by order of joining (No. 001, 002…). */
  number: number;
  /** Emblem from the library (vocab EMBLEMS, public/vignettes/ex-*). */
  emblem: string;
  ink: InkId;
  border: BorderId;
  /** A short motto set on the ribbon under the emblem. */
  motto: string;
}

/** The large image a member puts at the top of their page. */
export interface MemberCover {
  src: string;
  width: number;
  height: number;
  /** "original" shows it as uploaded; "ink" prints it in the member's ink, like a photogravure. */
  print: "original" | "ink";
}

/** 成员 — a member of the society. Their page is their own book: frontispiece, bookplate, library. */
export interface Member {
  id: string;
  name: Localized;
  handle: string;
  role: Localized;
  /** One line, shown in the cast list. */
  bio: Localized;
  /** Long self-introduction, Markdown (bilingual :::zh / :::en blocks allowed). */
  about: string;
  plate: Bookplate;
  cover?: MemberCover;
  joined: IsoDate;
  /** The wiki author record, when the member writes entries. */
  authorId?: string;
  links: Array<{ label: string; url: string }>;
  /** GitHub login; the page lists their public repositories. */
  github?: string;
  /** Placeholder data until the real member list is supplied. */
  sample?: boolean;
}

/** What a member may change on their own page. */
export interface MemberPatch {
  name?: Localized;
  role?: Localized;
  bio?: Localized;
  about?: string;
  links?: Array<{ label: string; url: string }>;
  github?: string | null;
  plate?: Partial<Omit<Bookplate, "number">>;
  coverPrint?: MemberCover["print"];
}

export type ForumCategory = "general" | "help" | "showcase" | "meta";

/** 交流 — one post in a thread. Bodies are plain text (paragraphs split on blank lines). */
export interface ForumPost {
  id: string;
  threadId: string;
  authorName: string;
  memberId?: string;
  body: string;
  createdAt: IsoDate;
}

export interface ForumThread {
  id: string;
  /** Sheet number in the register, 1-based. */
  number: number;
  title: string;
  category: ForumCategory;
  authorName: string;
  memberId?: string;
  createdAt: IsoDate;
  lastActivityAt: IsoDate;
  postCount: number;
  excerpt: string;
}

// ── 纪行 — the society's annals ─────────────────────────────────────────────

/** What an entry in the annals records. Labels live in vocab CHRONICLE_KINDS. */
export type ChronicleKind = "meeting" | "archive" | "material" | "milestone";

/** Where a chronicle's recording or material actually lives — always off-site. */
export type ChronicleResourceKind = "video" | "document" | "slides" | "code" | "link";

/**
 * A recording or a document hanging off a chronicle. Nothing here is stored by
 * the wiki: videos and files stay at their own address, only the label and the
 * link are catalogued.
 */
export interface ChronicleResource {
  kind: ChronicleResourceKind;
  label: Localized;
  /** External address; must be http(s). */
  url: string;
  note?: Localized;
  /** Free-form size or running time, e.g. "1h 42m", "12 MB". */
  detail?: string;
}

/** 纪行 — one dated record in the annals. */
export interface Chronicle {
  id: string;
  /** Register number, 1-based; printed as "No. 007". */
  number: number;
  /** Day of the activity, "2026-10-05". */
  date: IsoDate;
  kind: ChronicleKind;
  title: Localized;
  /** One line for the register; the long account lives in `body`. */
  summary: Localized;
  /** Members who hosted or took part (member ids). */
  hostIds: string[];
  resources: ChronicleResource[];
  /** Plates shown with the record; each is an asset id resolved through the reference repository. */
  gallery: Array<{ assetId: string; caption?: Localized }>;
  tags: string[];
  /** Placeholder data until the real annals are supplied. */
  sample?: boolean;
}

export interface ChronicleDetail extends Chronicle {
  /** Optional Markdown account (bilingual :::zh / :::en blocks allowed). */
  body?: string;
}
