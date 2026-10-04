import type {
  Asset,
  Author,
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
  title: Localized;
  summary: Localized;
  body: string;
  note: string;
  authorId: string;
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
}

// ── Search ──────────────────────────────────────────────────────────────────

export type SearchField = "id" | "title" | "summary" | "body" | "tags" | "author" | "source";

export interface SearchFilters {
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
  /** The signed-in author, or null for an anonymous reader. */
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
  references: ReferenceRepository;
  search: SearchAdapter;
  auth: AuthAdapter;
  community: CommunityRepository;
}
