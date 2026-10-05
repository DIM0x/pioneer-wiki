-- Pioneer Wiki content storage. The public website reads through RLS; writes
-- that span several rows use the security-definer functions below.
create extension if not exists pg_trgm;

create table if not exists public.authors (
  id text primary key,
  handle text not null unique,
  name_zh text not null,
  name_en text not null,
  affiliation_zh text,
  affiliation_en text,
  role text not null check (role in ('editor', 'contributor', 'reviewer')),
  sigil text not null
);

create table if not exists public.sources (
  id text primary key,
  kind text not null check (kind in ('book', 'paper', 'archive', 'web', 'specimen')),
  title text not null,
  creators text not null,
  year integer not null,
  publisher text,
  url text,
  locator text
);

create table if not exists public.tags (
  id text primary key,
  label_zh text not null,
  label_en text not null
);

create table if not exists public.assets (
  id text primary key,
  src text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt_zh text not null default '',
  alt_en text not null default '',
  caption_zh text,
  caption_en text,
  credit text not null,
  license text not null,
  source_url text
);

create table if not exists public.entries (
  id text primary key,
  slug text not null unique,
  title_zh text not null,
  title_en text not null,
  summary_zh text not null,
  summary_en text not null,
  analogue_name_zh text,
  analogue_name_en text,
  analogue_note_zh text,
  analogue_note_en text,
  domain text not null check (domain in ('algorithms', 'theory', 'languages', 'systems', 'architecture', 'networking', 'distributed', 'databases', 'ml', 'security')),
  scale text not null check (scale in ('macro', 'micro')),
  role text not null check (role in ('host', 'symbiont', 'decomposer', 'observer')),
  status text not null check (status in ('draft', 'in_review', 'published')),
  author_id text not null references public.authors(id),
  hero_asset_id text references public.assets(id),
  featured boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  latest_revision_number integer not null default 0,
  published_revision_number integer,
  deleted_at timestamptz
);

create table if not exists public.entry_revisions (
  id text primary key,
  entry_id text not null references public.entries(id) on delete cascade,
  number integer not null check (number > 0),
  parent_id text references public.entry_revisions(id),
  author_id text not null references public.authors(id),
  created_at timestamptz not null default now(),
  note text not null,
  state text not null check (state in ('draft', 'in_review', 'published')),
  added_lines integer not null default 0,
  removed_lines integer not null default 0,
  unique (entry_id, number)
);

create table if not exists public.entry_revision_bodies (
  revision_id text primary key references public.entry_revisions(id) on delete cascade,
  body text not null
);

create table if not exists public.entry_contributors (
  entry_id text not null references public.entries(id) on delete cascade,
  author_id text not null references public.authors(id),
  primary key (entry_id, author_id)
);

create table if not exists public.entry_sources (
  entry_id text not null references public.entries(id) on delete cascade,
  source_id text not null references public.sources(id),
  primary key (entry_id, source_id)
);

create table if not exists public.entry_tags (
  entry_id text not null references public.entries(id) on delete cascade,
  tag_id text not null references public.tags(id),
  primary key (entry_id, tag_id)
);

create table if not exists public.relations (
  id text primary key,
  from_entry_id text not null references public.entries(id) on delete cascade,
  to_entry_id text not null references public.entries(id) on delete cascade,
  kind text not null check (kind in ('symbiosis', 'source', 'taxonomy', 'contrast', 'dependency', 'dispute')),
  note_zh text,
  note_en text,
  strength integer not null check (strength between 1 and 3),
  unique (from_entry_id, to_entry_id, kind)
);

create table if not exists public.friend_links (
  id text primary key,
  name_zh text not null,
  name_en text not null,
  url text not null,
  description_zh text not null,
  description_en text not null,
  emblem text not null,
  since date not null,
  sample boolean not null default false
);

create table if not exists public.members (
  id text primary key,
  name_zh text not null,
  name_en text not null,
  handle text not null unique,
  role_zh text not null,
  role_en text not null,
  bio_zh text not null,
  bio_en text not null,
  about text not null,
  plate_number integer not null,
  plate_emblem text not null,
  plate_ink text not null,
  plate_border text not null,
  plate_motto text not null,
  cover_src text,
  cover_width integer,
  cover_height integer,
  cover_print text check (cover_print in ('original', 'ink')),
  joined date not null,
  author_id text references public.authors(id),
  links jsonb not null default '[]'::jsonb,
  github text,
  sample boolean not null default false
);

create table if not exists public.forum_threads (
  id text primary key,
  number integer not null unique,
  title text not null,
  category text not null check (category in ('general', 'help', 'showcase', 'meta')),
  author_name text not null,
  member_id text references public.members(id),
  created_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.forum_posts (
  id text primary key,
  thread_id text not null references public.forum_threads(id) on delete cascade,
  author_name text not null,
  member_id text references public.members(id),
  body text not null,
  created_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  object_path text not null unique,
  bucket text not null default 'member-covers',
  width integer not null,
  height integer not null,
  content_type text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  object_type text not null,
  object_id text not null,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists entries_updated_at_idx on public.entries (updated_at desc);
create index if not exists entries_status_idx on public.entries (status);
create index if not exists entries_title_trgm_idx on public.entries using gin ((title_zh || ' ' || title_en) gin_trgm_ops);
create index if not exists entry_revision_entry_idx on public.entry_revisions (entry_id, number desc);
create index if not exists forum_posts_thread_idx on public.forum_posts (thread_id, created_at);

alter table public.entries enable row level security;
alter table public.entry_revisions enable row level security;
alter table public.entry_revision_bodies enable row level security;
alter table public.authors enable row level security;
alter table public.sources enable row level security;
alter table public.tags enable row level security;
alter table public.assets enable row level security;
alter table public.relations enable row level security;
alter table public.friend_links enable row level security;
alter table public.members enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.pw_can_manage()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and account_role = 'admin');
$$;

create or replace function public.pw_bound_author()
returns text language sql stable security definer set search_path = '' as $$
  select author_id from public.profiles where id = auth.uid();
$$;

create or replace function public.pw_verified()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null);
$$;

drop policy if exists "public reads published entries" on public.entries;
create policy "public reads published entries" on public.entries for select using (
  deleted_at is null and (published_revision_number is not null or author_id = public.pw_bound_author() or public.pw_can_manage())
);
drop policy if exists "authors manage own entries" on public.entries;
create policy "authors manage own entries" on public.entries for update using (author_id = public.pw_bound_author() or public.pw_can_manage()) with check (author_id = public.pw_bound_author() or public.pw_can_manage());
drop policy if exists "admins insert entries" on public.entries;
create policy "admins insert entries" on public.entries for insert with check (public.pw_can_manage() or author_id = public.pw_bound_author());

create policy "visible revisions" on public.entry_revisions for select using (
  exists (select 1 from public.entries e where e.id = entry_id and (e.published_revision_number = number or e.author_id = public.pw_bound_author() or public.pw_can_manage()))
);
create policy "visible revision bodies" on public.entry_revision_bodies for select using (
  exists (select 1 from public.entry_revisions r join public.entries e on e.id = r.entry_id where r.id = revision_id and (e.published_revision_number = r.number or e.author_id = public.pw_bound_author() or public.pw_can_manage()))
);

create policy "public reference reads" on public.authors for select using (true);
create policy "public source reads" on public.sources for select using (true);
create policy "public tag reads" on public.tags for select using (true);
create policy "public asset reads" on public.assets for select using (true);
create policy "public relation reads" on public.relations for select using (true);
create policy "public link reads" on public.friend_links for select using (true);
create policy "public member reads" on public.members for select using (true);
create policy "admins manage authors" on public.authors for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "admins manage sources" on public.sources for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "admins manage tags" on public.tags for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "admins manage assets" on public.assets for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "admins manage relations" on public.relations for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "admins manage links" on public.friend_links for all using (public.pw_can_manage()) with check (public.pw_can_manage());
create policy "owners update members" on public.members for update using (author_id = public.pw_bound_author() or public.pw_can_manage()) with check (author_id = public.pw_bound_author() or public.pw_can_manage());
create policy "public thread reads" on public.forum_threads for select using (deleted_at is null);
create policy "public post reads" on public.forum_posts for select using (deleted_at is null);
create policy "verified users create threads" on public.forum_threads for insert to authenticated with check (public.pw_verified());
create policy "verified users create posts" on public.forum_posts for insert to authenticated with check (public.pw_verified());
create policy "owner media reads" on public.media_assets for select using (owner_id = auth.uid() or public.pw_can_manage());
create policy "owner media insert" on public.media_assets for insert to authenticated with check (owner_id = auth.uid());
create policy "owner media update" on public.media_assets for update to authenticated using (owner_id = auth.uid() or public.pw_can_manage()) with check (owner_id = auth.uid() or public.pw_can_manage());
create policy "admins read audit" on public.audit_logs for select using (public.pw_can_manage());

-- Audit logs are append-only. Only the database functions below may insert them.
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
create or replace function public.pw_audit_insert(
  p_action text, p_object_type text, p_object_id text, p_before jsonb, p_after jsonb
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(actor_id, action, object_type, object_id, before_data, after_data)
  values (auth.uid(), p_action, p_object_type, p_object_id, p_before, p_after);
end;
$$;
revoke execute on function public.pw_audit_insert(text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.pw_audit_insert(text, text, text, jsonb, jsonb) to authenticated;

create or replace function public.pw_save_draft(
  p_entry_id text, p_domain text, p_title_zh text, p_title_en text,
  p_summary_zh text, p_summary_en text, p_body text, p_note text,
  p_base_revision integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  now_at timestamptz := now();
  actor text := public.pw_bound_author();
begin
  if actor is null then raise exception 'author_required' using errcode = '42501'; end if;
  if p_entry_id is null then
    if p_domain is null or p_domain not in ('algorithms', 'theory', 'languages', 'systems', 'architecture', 'networking', 'distributed', 'databases', 'ml', 'security') then raise exception 'invalid_domain' using errcode = '22023'; end if;
    p_entry_id := 'PW-' || lpad((coalesce((select max(nullif(regexp_replace(id, '\D', '', 'g'), '')::integer) from public.entries), 0) + 1)::text, 4, '0');
    insert into public.entries(id, slug, title_zh, title_en, summary_zh, summary_en, domain, scale, role, status, author_id, created_at, updated_at, latest_revision_number)
    values (p_entry_id, regexp_replace(lower(p_title_en), '[^a-z0-9]+', '-', 'g'), p_title_zh, p_title_en, p_summary_zh, p_summary_en, p_domain, 'micro', 'observer', 'draft', actor, now_at, now_at, 0) returning * into e;
  else
    select * into e from public.entries where id = p_entry_id for update;
    if not found then raise exception 'entry_not_found' using errcode = '22023'; end if;
    if e.author_id <> actor and not public.pw_can_manage() then raise exception 'forbidden' using errcode = '42501'; end if;
    if p_base_revision is not null and p_base_revision <> e.latest_revision_number then raise exception 'revision_conflict' using errcode = '40001'; end if;
    update public.entries set title_zh = p_title_zh, title_en = p_title_en, summary_zh = p_summary_zh, summary_en = p_summary_en, status = 'draft', updated_at = now_at where id = p_entry_id returning * into e;
  end if;
  n := e.latest_revision_number + 1;
  rid := e.id || '@r' || n;
  insert into public.entry_revisions(id, entry_id, number, parent_id, author_id, note, state) values (rid, e.id, n, case when n > 1 then e.id || '@r' || (n - 1) end, actor, coalesce(nullif(p_note, ''), 'Save draft'), 'draft');
  insert into public.entry_revision_bodies(revision_id, body) values (rid, p_body);
  update public.entries set latest_revision_number = n, updated_at = now_at where id = e.id;
  perform public.pw_audit_insert('save_draft', 'entry', e.id, to_jsonb(e), jsonb_build_object('revision', rid));
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', case when n > 1 then e.id || '@r' || (n - 1) end, 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), 'Save draft'), 'state', 'draft', 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;

create or replace function public.pw_transition_entry(
  p_entry_id text, p_action text, p_target_revision_id text, p_note text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  source_body text;
  actor text := public.pw_bound_author();
  now_at timestamptz := now();
  next_state text;
begin
  if actor is null then raise exception 'author_required' using errcode = '42501'; end if;
  select * into e from public.entries where id = p_entry_id for update;
  if not found then raise exception 'entry_not_found' using errcode = '22023'; end if;
  if p_action = 'submit' then
    if e.author_id <> actor and not public.pw_can_manage() then raise exception 'forbidden' using errcode = '42501'; end if;
    if e.status <> 'draft' then raise exception 'invalid_transition' using errcode = '40001'; end if;
    next_state := 'in_review';
    select b.body into source_body from public.entry_revision_bodies b where b.revision_id = e.id || '@r' || e.latest_revision_number;
  elsif p_action in ('publish', 'rollback') then
    if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
    if p_action = 'publish' and e.status <> 'in_review' then raise exception 'invalid_transition' using errcode = '40001'; end if;
    if p_action = 'rollback' then
      select b.body into source_body from public.entry_revision_bodies b where b.revision_id = p_target_revision_id;
      if source_body is null then raise exception 'revision_not_found' using errcode = '22023'; end if;
    else
      select b.body into source_body from public.entry_revision_bodies b where b.revision_id = e.id || '@r' || e.latest_revision_number;
    end if;
    next_state := 'published';
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  n := e.latest_revision_number + 1;
  rid := e.id || '@r' || n;
  insert into public.entry_revisions(id, entry_id, number, parent_id, author_id, note, state) values (rid, e.id, n, e.id || '@r' || e.latest_revision_number, actor, coalesce(nullif(p_note, ''), p_action), next_state);
  insert into public.entry_revision_bodies(revision_id, body) values (rid, source_body);
  update public.entries set status = next_state, latest_revision_number = n, published_revision_number = case when next_state = 'published' then n else published_revision_number end, updated_at = now_at where id = e.id;
  perform public.pw_audit_insert(p_action, 'entry', e.id, to_jsonb(e), jsonb_build_object('revision', rid, 'state', next_state));
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', e.id || '@r' || e.latest_revision_number, 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), p_action), 'state', next_state, 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;

create or replace function public.pw_search_entries(
  p_text text, p_domain text default null, p_scale text default null, p_status text default null,
  p_lang text default null, p_author text default null, p_limit integer default 50, p_offset integer default 0
) returns setof jsonb language sql stable security invoker set search_path = public as $$
  with candidates as (
    select e.*, coalesce(r.number, e.published_revision_number) as visible_revision,
      coalesce(nullif(p_text, ''), '') as q
    from public.entries e
    left join public.entry_revisions r on r.entry_id = e.id and r.number = case when e.author_id = public.pw_bound_author() or public.pw_can_manage() then e.latest_revision_number else e.published_revision_number end
    where e.deleted_at is null
      and (coalesce(p_text, '') = '' or to_tsvector('simple', concat_ws(' ', e.id, e.title_zh, e.title_en, e.summary_zh, e.summary_en)) @@ plainto_tsquery('simple', p_text) or concat_ws(' ', e.id, e.title_zh, e.title_en, e.summary_zh, e.summary_en) ilike '%' || p_text || '%')
      and (p_domain is null or e.domain = p_domain) and (p_scale is null or e.scale = p_scale)
      and (p_status is null or e.status = p_status) and (p_author is null or e.author_id = p_author)
    order by e.updated_at desc
    limit greatest(0, least(p_limit, 100)) offset greatest(0, p_offset)
  )
  select jsonb_build_object('entry', jsonb_build_object('id', c.id, 'slug', c.slug, 'title', jsonb_build_object('zh', c.title_zh, 'en', c.title_en), 'summary', jsonb_build_object('zh', c.summary_zh, 'en', c.summary_en), 'domain', c.domain, 'scale', c.scale, 'role', c.role, 'status', c.status, 'authorId', c.author_id, 'contributorIds', '[]'::jsonb, 'sourceIds', '[]'::jsonb, 'tagIds', '[]'::jsonb, 'bodyLanguages', array['zh','en'], 'createdAt', c.created_at, 'updatedAt', c.updated_at, 'revision', coalesce(c.visible_revision, 0)), 'score', 1, 'matchedFields', array['title']::text[], 'snippet', null)
  from candidates c;
$$;

revoke execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer) from public, anon;
revoke execute on function public.pw_transition_entry(text, text, text, text) from public, anon;
grant execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer) to authenticated;
grant execute on function public.pw_transition_entry(text, text, text, text) to authenticated;
grant execute on function public.pw_search_entries(text, text, text, text, text, text, integer, integer) to anon, authenticated;

-- Storage bucket and policies. Existing public illustrations remain in the repo.
insert into storage.buckets (id, name, public) values ('member-covers', 'member-covers', true) on conflict (id) do nothing;
drop policy if exists "member covers read" on storage.objects;
create policy "member covers read" on storage.objects for select using (bucket_id = 'member-covers');
drop policy if exists "member covers owner upload" on storage.objects;
create policy "member covers owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'member-covers' and owner = auth.uid());
drop policy if exists "member covers owner delete" on storage.objects;
create policy "member covers owner delete" on storage.objects for delete to authenticated using (bucket_id = 'member-covers' and (owner = auth.uid() or public.pw_can_manage()));
