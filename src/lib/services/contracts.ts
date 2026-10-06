import type {
  Asset,
  Account,
  Author,
  Category,
  Chronicle,
  ChronicleDetail,
  ChronicleKind,
  DomainId,
  Entry,
  EntryId,
  EntrySlug,
  EntrySummary,
  ForumCategory,
  ForumPost,
  ForumThread,
  FriendLink,
  Lang,
  Localized,
  Member,
  MemberCover,
  MemberPatch,
  Relation,
  ReviewState,
  Revision,
  Scale,
  Source,
  Tag,
  EntryMetadata,
  Family,
  TaxonKind,
  TaxonLink,
  TaxonVersion,
} from "@/lib/model/types";

/*
 * Service contracts. Pages and components talk to these interfaces only.
 * The mock implementations live in `./mock`; a CMS, search engine or auth
 * provider replaces them by implementing the same interface and being
 * selected in `./index.ts` (env `PIONEER_DATA_SOURCE`).
 *
 * Error contract: methods resolve `null` / `[]` for "not found"; they throw
 * `ServiceError` for everything else (unavailable, conflict, forbidden).
 */

export type ServiceErrorCode = "unavailable" | "conflict" | "forbidden" | "invalid";

export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// ── Entries, revisions, relations ───────────────────────────────────────────

export interface EntryQuery {
  status?: ReviewState[];
  /** Entries whose published genus is one of these. */
  categoryId?: string[];
  /** Entries whose published genus belongs to one of these families. */
  familyId?: string[];
  /** Entries that list one of these genera as a cross-genus reference. */
  auxiliaryCategoryId?: string[];
  /** @deprecated The ten phyla before the family → genus catalogue; kept for older callers. */
  domain?: DomainId[];
  scale?: Scale[];
  featured?: boolean;
  /** Default "updated" (newest first). */
  sort?: "updated" | "created";
  limit?: number;
}

export interface DraftInput {
  /** Omit to create a new entry. */
  entryId?: EntryId;
  /**
   * Genus of a new entry; required when creating unless `metadata.categoryId` carries it.
   * Existing entries are refiled through `metadata`, which belongs to the revision.
   */
  categoryId?: string;
  /** @deprecated Phylum of a new entry before the family → genus catalogue. */
  domain?: DomainId;
  title: Localized;
  summary: Localized;
  body: string;
  note: string;
  authorId: string;
  /** Revision the editor started from; used for optimistic concurrency. */
  baseRevision?: number;
  metadata?: EntryMetadata;
}

export type ReviewAction = "submit" | "publish" | "rollback";

export interface ReviewTransitionInput {
  entryId: EntryId;
  action: ReviewAction;
  actorId: string;
  /** Required for "rollback": the revision whose content becomes current again. */
  targetRevisionId?: string;
  note?: string;
}

export interface EntryRepository {
  listEntries(query?: EntryQuery): Promise<EntrySummary[]>;
  getEntry(slug: EntrySlug): Promise<Entry | null>;
  getEntryById(id: EntryId): Promise<Entry | null>;
  /** Newest first. */
  listRevisions(entryId: EntryId): Promise<Revision[]>;
  getRevisionBody(revisionId: string): Promise<string | null>;
  /** All relations touching the entry (either direction), or every relation. */
  listRelations(entryId?: EntryId): Promise<Relation[]>;
  saveDraft(input: DraftInput): Promise<Revision>;
  transition(input: ReviewTransitionInput): Promise<Revision>;
}

// ── Reference data ──────────────────────────────────────────────────────────

export interface ReferenceRepository {
  listAuthors(): Promise<Author[]>;
  listSources(): Promise<Source[]>;
  listTags(): Promise<Tag[]>;
  getAsset(id: string): Promise<Asset | null>;
  listAssets(): Promise<Asset[]>;
}

// ── Taxonomy: families and genera ───────────────────────────────────────────

export interface TaxonomyQuery {
  /** Include archived taxa (administration only). Default false. */
  includeArchived?: boolean;
}

/** What an administrator may change on a family or a genus. The id never changes. */
export interface TaxonPatch {
  slug?: string;
  name?: Localized;
  scientificName?: string;
  taxonNameZh?: string | null;
  intro?: Localized;
  essay?: string;
  emblemAssetId?: string | null;
  links?: TaxonLink[];
  leadId?: string | null;
  collaboratorIds?: string[];
  sortOrder?: number;
  /** Genus only: move it to another family. */
  familyId?: string;
  /** Genus only. */
  representativeSlug?: string | null;
}

export interface TaxonSaveInput {
  kind: TaxonKind;
  /** Omit to create a new taxon; `patch` must then carry slug, name and scientific name (and familyId for a genus). */
  id?: string;
  patch: TaxonPatch;
  note: string;
  actorId?: string;
  /** Version the editor started from; used for optimistic concurrency. */
  baseVersion?: number;
}

/**
 * The catalogue. Saving is administrator-only and public at once, but every
 * change is kept as a version. There is deliberately no delete: a taxon can be
 * archived, which hides it from readers, and restored.
 */
export interface TaxonomyRepository {
  /** Sorted by sortOrder. */
  listFamilies(query?: TaxonomyQuery): Promise<Family[]>;
  /** Sorted by family order, then sortOrder. */
  listCategories(query?: TaxonomyQuery & { familyId?: string }): Promise<Category[]>;
  /** By slug or a former slug; archived taxa resolve only with includeArchived. */
  getFamily(slug: string, query?: TaxonomyQuery): Promise<Family | null>;
  getCategory(slug: string, query?: TaxonomyQuery): Promise<Category | null>;
  /** Throws ServiceError("invalid") for bad values, ("conflict") for a stale baseVersion or a taken slug. */
  saveTaxon(input: TaxonSaveInput): Promise<TaxonVersion>;
  /** Archiving a family requires every genus in it to be archived first. */
  archiveTaxon(kind: TaxonKind, id: string, actorId?: string, note?: string): Promise<TaxonVersion>;
  restoreTaxon(kind: TaxonKind, id: string, actorId?: string, note?: string): Promise<TaxonVersion>;
  /** Newest first. */
  listTaxonVersions(kind: TaxonKind, id: string): Promise<TaxonVersion[]>;
  /** Makes an old version's content current again, as a new version. */
  revertTaxon(kind: TaxonKind, id: string, versionNumber: number, actorId?: string): Promise<TaxonVersion>;
}

// ── Search ──────────────────────────────────────────────────────────────────

export type SearchField = "id" | "title" | "summary" | "body" | "tags" | "author" | "source";

export interface SearchFilters {
  familyId?: string[];
  categoryId?: string[];
  /** @deprecated */
  domain?: DomainId[];
  scale?: Scale[];
  status?: ReviewState[];
  lang?: Lang[];
  author?: string[];
}

export interface SearchQuery {
  text: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchSnippet {
  field: SearchField;
  text: string;
  /** [start, end) character ranges inside `text` to highlight. */
  highlights: Array<[number, number]>;
}

export interface SearchHit {
  entry: EntrySummary;
  score: number;
  matchedFields: SearchField[];
  snippet: SearchSnippet | null;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  /** Counts per filter value over the text-matched set, before filters apply. */
  facets: {
    family: Partial<Record<string, number>>;
    category: Partial<Record<string, number>>;
    domain: Partial<Record<DomainId, number>>;
    scale: Partial<Record<Scale, number>>;
    status: Partial<Record<ReviewState, number>>;
    lang: Partial<Record<Lang, number>>;
  };
}

export interface SearchAdapter {
  search(query: SearchQuery): Promise<SearchResult>;
}

// ── Identity ────────────────────────────────────────────────────────────────

export interface AuthAdapter {
  /** The signed-in account, including accounts that have no wiki author binding yet. */
  getCurrentAccount(): Promise<Account | null>;
  /** The signed-in wiki author, or null for an anonymous/unbound reader. */
  getCurrentUser(): Promise<Author | null>;
}

// ── Community: links, members, forum ────────────────────────────────────────

export interface NewThreadInput {
  title: string;
  body: string;
  category: ForumCategory;
  authorName: string;
  memberId?: string;
}

export interface NewPostInput {
  threadId: string;
  body: string;
  authorName: string;
  memberId?: string;
}

export interface CommunityRepository {
  listLinks(): Promise<FriendLink[]>;
  listMembers(): Promise<Member[]>;
  getMember(handle: string): Promise<Member | null>;
  /** Throws ServiceError("invalid") for bad values; resolves null when the member does not exist. */
  updateMember(handle: string, patch: MemberPatch): Promise<Member | null>;
  /** Sets (or with null, removes) the member's large page image. */
  setMemberCover(handle: string, cover: MemberCover | null): Promise<Member | null>;
  /** Every forum post the member wrote, newest first, with its thread. */
  listPostsBy(memberId: string): Promise<Array<{ post: ForumPost; thread: ForumThread }>>;
  /** Most recently active first. */
  listThreads(query?: { category?: ForumCategory; limit?: number }): Promise<ForumThread[]>;
  /** The thread and its posts, oldest first; null when it does not exist. */
  getThread(id: string): Promise<{ thread: ForumThread; posts: ForumPost[] } | null>;
  /** Throws ServiceError("invalid") when title/body are empty or too long. */
  createThread(input: NewThreadInput): Promise<ForumThread>;
  /** Throws ServiceError("invalid") for an empty body; resolves null when the thread does not exist. */
  reply(input: NewPostInput): Promise<ForumPost | null>;
}

export interface WikiServices {
  entries: EntryRepository;
  taxonomy: TaxonomyRepository;
  references: ReferenceRepository;
  search: SearchAdapter;
  auth: AuthAdapter;
  community: CommunityRepository;
  chronicles: ChronicleRepository;
}

// ── 纪行: the society's annals ──────────────────────────────────────────────

export interface ChronicleQuery {
  kind?: ChronicleKind[];
  year?: number;
  limit?: number;
}

export interface ChronicleRepository {
  /** Newest first: date descending, then register number descending. */
  listChronicles(query?: ChronicleQuery): Promise<Chronicle[]>;
  /** The record with its optional account; null when it does not exist. */
  getChronicle(id: string): Promise<ChronicleDetail | null>;
}
