-- The family → genus catalogue (Issue #9).
--
-- Families (大类) and genera (门类) are curated objects: administrators save them
-- and the change is public at once, but every state is kept as a version, and
-- a taxon can only be archived, never deleted. Where an entry is filed — one
-- primary genus, any number of cross-genus references, its species, level and
-- role — belongs to the revision: drafts carry it in entry_revisions.metadata
-- and it reaches the public columns only when that revision is published.
--
-- Rollback: the old `domain` column is kept (now nullable) and still filled for
-- the sixteen existing entries, so the previous application keeps reading it.

create table if not exists public.taxon_families (
  id text primary key,
  slug text not null unique,
  former_slugs text[] not null default '{}',
  name_zh text not null,
  name_en text not null,
  scientific_name text not null,
  taxon_name_zh text,
  intro_zh text not null default '',
  intro_en text not null default '',
  essay text not null default '',
  emblem_asset_id text references public.assets(id),
  links jsonb not null default '[]'::jsonb,
  lead_id text references public.authors(id),
  collaborator_ids text[] not null default '{}',
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.taxon_categories (
  id text primary key,
  family_id text not null references public.taxon_families(id),
  slug text not null unique,
  former_slugs text[] not null default '{}',
  name_zh text not null,
  name_en text not null,
  scientific_name text not null,
  taxon_name_zh text,
  intro_zh text not null default '',
  intro_en text not null default '',
  essay text not null default '',
  emblem_asset_id text references public.assets(id),
  links jsonb not null default '[]'::jsonb,
  lead_id text references public.authors(id),
  collaborator_ids text[] not null default '{}',
  representative_slug text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.taxon_versions (
  id text primary key,
  kind text not null check (kind in ('family', 'category')),
  taxon_id text not null,
  number integer not null check (number > 0),
  data jsonb not null,
  note text not null default '',
  author_id text references public.authors(id),
  created_at timestamptz not null default now(),
  unique (kind, taxon_id, number)
);

-- The published place of every entry. Drafts keep theirs in entry_revisions.metadata.
alter table public.entries alter column domain drop not null;
alter table public.entries add column if not exists category_id text references public.taxon_categories(id);
alter table public.entries add column if not exists species text;
alter table public.entries add column if not exists level text not null default 'concept' check (level in ('intro', 'concept', 'practice', 'reference'));
alter table public.entries add column if not exists content_role text not null default 'foundation' check (content_role in ('foundation', 'method', 'tool', 'case', 'perspective'));

create table if not exists public.entry_auxiliary_categories (
  entry_id text not null references public.entries(id) on delete cascade,
  category_id text not null references public.taxon_categories(id),
  primary key (entry_id, category_id)
);

create index if not exists taxon_categories_family_idx on public.taxon_categories (family_id, sort_order);
create index if not exists taxon_versions_taxon_idx on public.taxon_versions (kind, taxon_id, number desc);
create index if not exists entries_category_idx on public.entries (category_id);
create index if not exists entry_auxiliary_category_idx on public.entry_auxiliary_categories (category_id);

alter table public.taxon_families enable row level security;
alter table public.taxon_categories enable row level security;
alter table public.taxon_versions enable row level security;
alter table public.entry_auxiliary_categories enable row level security;

-- Readers see active taxa; administrators see archived ones too. Writes go
-- through the functions below only, so every change leaves a version.
drop policy if exists "public reads active families" on public.taxon_families;
create policy "public reads active families" on public.taxon_families for select using (status = 'active' or public.pw_can_manage());
drop policy if exists "public reads active categories" on public.taxon_categories;
create policy "public reads active categories" on public.taxon_categories for select using (status = 'active' or public.pw_can_manage());
drop policy if exists "admins read taxon versions" on public.taxon_versions;
create policy "admins read taxon versions" on public.taxon_versions for select using (public.pw_can_manage());
drop policy if exists "public auxiliary category reads" on public.entry_auxiliary_categories;
create policy "public auxiliary category reads" on public.entry_auxiliary_categories for select using (true);
revoke insert, update, delete on public.taxon_families, public.taxon_categories, public.taxon_versions, public.entry_auxiliary_categories from anon, authenticated;

-- ── Taxon writes ────────────────────────────────────────────────────────────

create or replace function public.pw_taxon_row(p_kind text, p_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  data jsonb;
begin
  if p_kind = 'family' then
    select to_jsonb(f) into data from public.taxon_families f where f.id = p_id;
  else
    select to_jsonb(c) into data from public.taxon_categories c where c.id = p_id;
  end if;
  return data;
end;
$$;
revoke execute on function public.pw_taxon_row(text, text) from public, anon, authenticated;

create or replace function public.pw_record_taxon_version(p_kind text, p_id text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  data jsonb := public.pw_taxon_row(p_kind, p_id);
  n integer := (data->>'version')::integer;
  vid text := p_kind || ':' || p_id || '@v' || n;
  actor text := public.pw_bound_author();
  now_at timestamptz := now();
begin
  insert into public.taxon_versions(id, kind, taxon_id, number, data, note, author_id, created_at)
  values (vid, p_kind, p_id, n, data, coalesce(p_note, ''), actor, now_at);
  perform public.pw_audit_insert('save_taxon', p_kind, p_id, null, jsonb_build_object('version', n, 'note', p_note));
  return jsonb_build_object('id', vid, 'kind', p_kind, 'taxonId', p_id, 'number', n, 'data', data, 'note', coalesce(p_note, ''), 'authorId', actor, 'createdAt', now_at);
end;
$$;
revoke execute on function public.pw_record_taxon_version(text, text, text) from public, anon, authenticated;

-- A link is a site path or an http(s) address, with a label in at least one language.
create or replace function public.pw_valid_taxon_links(p_links jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(coalesce(p_links, '[]'::jsonb)) = 'array' and not exists (
    select 1 from jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) l
    where coalesce(nullif(trim(l #>> '{label,zh}'), ''), nullif(trim(l #>> '{label,en}'), '')) is null
       or not ((l->>'url') ~ '^/[^/]' or (l->>'url') = '/' or (l->>'url') ~* '^https?://[^\s/]+')
  );
$$;

/*
 * Saves a family or a genus. p_id null creates one (the slug becomes the stable
 * id). p_patch holds only the fields to change, named as in TaxonPatch.
 */
create or replace function public.pw_save_taxon(
  p_kind text, p_id text, p_patch jsonb, p_note text, p_base_version integer default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  patch jsonb := coalesce(p_patch, '{}'::jsonb);
  cur jsonb;
  taxon_id text := p_id;
  new_slug text := patch->>'slug';
begin
  if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_kind not in ('family', 'category') then raise exception 'invalid_kind' using errcode = '22023'; end if;
  if new_slug is not null and new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid_slug' using errcode = '22023'; end if;
  if patch ? 'name' and (coalesce(trim(patch #>> '{name,zh}'), '') = '' or coalesce(trim(patch #>> '{name,en}'), '') = '') then raise exception 'invalid_name' using errcode = '22023'; end if;
  if patch ? 'scientificName' and (patch->>'scientificName') !~ '^[A-Z][a-z]+$' then raise exception 'invalid_scientific_name' using errcode = '22023'; end if;
  if patch ? 'links' and not public.pw_valid_taxon_links(patch->'links') then raise exception 'invalid_links' using errcode = '22023'; end if;
  if patch ? 'sortOrder' and (patch->>'sortOrder')::integer < 0 then raise exception 'invalid_sort_order' using errcode = '22023'; end if;
  if p_kind = 'category' and patch ? 'familyId' and not exists (select 1 from public.taxon_families where id = patch->>'familyId' and status = 'active') then raise exception 'invalid_family' using errcode = '22023'; end if;

  if taxon_id is null then
    if new_slug is null or not patch ? 'name' or not patch ? 'scientificName' then raise exception 'taxon_incomplete' using errcode = '22023'; end if;
    taxon_id := new_slug;
    if p_kind = 'family' then
      if exists (select 1 from public.taxon_families where id = taxon_id or slug = new_slug or new_slug = any(former_slugs)) then raise exception 'slug_taken' using errcode = '40001'; end if;
      insert into public.taxon_families(id, slug, name_zh, name_en, scientific_name, sort_order, version)
      values (taxon_id, new_slug, patch #>> '{name,zh}', patch #>> '{name,en}', patch->>'scientificName', coalesce((patch->>'sortOrder')::integer, (select count(*) + 1 from public.taxon_families)), 0);
    else
      if not patch ? 'familyId' then raise exception 'family_required' using errcode = '22023'; end if;
      if exists (select 1 from public.taxon_categories where id = taxon_id or slug = new_slug or new_slug = any(former_slugs)) then raise exception 'slug_taken' using errcode = '40001'; end if;
      insert into public.taxon_categories(id, family_id, slug, name_zh, name_en, scientific_name, sort_order, version)
      values (taxon_id, patch->>'familyId', new_slug, patch #>> '{name,zh}', patch #>> '{name,en}', patch->>'scientificName', coalesce((patch->>'sortOrder')::integer, (select count(*) + 1 from public.taxon_categories where family_id = patch->>'familyId')), 0);
    end if;
  end if;

  cur := public.pw_taxon_row(p_kind, taxon_id);
  if cur is null then raise exception 'taxon_not_found' using errcode = '22023'; end if;
  if p_base_version is not null and p_base_version <> (cur->>'version')::integer then raise exception 'version_conflict' using errcode = '40001'; end if;
  if new_slug is not null and new_slug <> cur->>'slug' then
    if p_kind = 'family' and exists (select 1 from public.taxon_families where id <> taxon_id and (slug = new_slug or new_slug = any(former_slugs))) then raise exception 'slug_taken' using errcode = '40001'; end if;
    if p_kind = 'category' and exists (select 1 from public.taxon_categories where id <> taxon_id and (slug = new_slug or new_slug = any(former_slugs))) then raise exception 'slug_taken' using errcode = '40001'; end if;
  end if;

  if p_kind = 'family' then
    update public.taxon_families set
      former_slugs = case when new_slug is not null and new_slug <> slug then array_append(array_remove(former_slugs, new_slug), slug) else former_slugs end,
      slug = coalesce(new_slug, slug),
      name_zh = coalesce(trim(patch #>> '{name,zh}'), name_zh),
      name_en = coalesce(trim(patch #>> '{name,en}'), name_en),
      scientific_name = coalesce(patch->>'scientificName', scientific_name),
      taxon_name_zh = case when patch ? 'taxonNameZh' then nullif(trim(patch->>'taxonNameZh'), '') else taxon_name_zh end,
      intro_zh = coalesce(trim(patch #>> '{intro,zh}'), intro_zh),
      intro_en = coalesce(trim(patch #>> '{intro,en}'), intro_en),
      essay = coalesce(patch->>'essay', essay),
      emblem_asset_id = case when patch ? 'emblemAssetId' then nullif(patch->>'emblemAssetId', '') else emblem_asset_id end,
      links = coalesce(patch->'links', links),
      lead_id = case when patch ? 'leadId' then nullif(patch->>'leadId', '') else lead_id end,
      collaborator_ids = case when patch ? 'collaboratorIds' then array(select distinct jsonb_array_elements_text(patch->'collaboratorIds')) else collaborator_ids end,
      sort_order = coalesce((patch->>'sortOrder')::integer, sort_order),
      updated_at = now(),
      version = version + 1
    where id = taxon_id;
  else
    update public.taxon_categories set
      former_slugs = case when new_slug is not null and new_slug <> slug then array_append(array_remove(former_slugs, new_slug), slug) else former_slugs end,
      slug = coalesce(new_slug, slug),
      family_id = coalesce(patch->>'familyId', family_id),
      name_zh = coalesce(trim(patch #>> '{name,zh}'), name_zh),
      name_en = coalesce(trim(patch #>> '{name,en}'), name_en),
      scientific_name = coalesce(patch->>'scientificName', scientific_name),
      taxon_name_zh = case when patch ? 'taxonNameZh' then nullif(trim(patch->>'taxonNameZh'), '') else taxon_name_zh end,
      intro_zh = coalesce(trim(patch #>> '{intro,zh}'), intro_zh),
      intro_en = coalesce(trim(patch #>> '{intro,en}'), intro_en),
      essay = coalesce(patch->>'essay', essay),
      emblem_asset_id = case when patch ? 'emblemAssetId' then nullif(patch->>'emblemAssetId', '') else emblem_asset_id end,
      links = coalesce(patch->'links', links),
      lead_id = case when patch ? 'leadId' then nullif(patch->>'leadId', '') else lead_id end,
      collaborator_ids = case when patch ? 'collaboratorIds' then array(select distinct jsonb_array_elements_text(patch->'collaboratorIds')) else collaborator_ids end,
      representative_slug = case when patch ? 'representativeSlug' then nullif(patch->>'representativeSlug', '') else representative_slug end,
      sort_order = coalesce((patch->>'sortOrder')::integer, sort_order),
      updated_at = now(),
      version = version + 1
    where id = taxon_id;
  end if;
  return public.pw_record_taxon_version(p_kind, taxon_id, coalesce(nullif(p_note, ''), case when p_id is null then 'Created' else 'Saved' end));
end;
$$;

create or replace function public.pw_set_taxon_status(p_kind text, p_id text, p_status text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  cur jsonb;
begin
  if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_status not in ('active', 'archived') then raise exception 'invalid_status' using errcode = '22023'; end if;
  cur := public.pw_taxon_row(p_kind, p_id);
  if cur is null then raise exception 'taxon_not_found' using errcode = '22023'; end if;
  if cur->>'status' = p_status then raise exception 'unchanged_status' using errcode = '40001'; end if;
  if p_kind = 'family' then
    if p_status = 'archived' and exists (select 1 from public.taxon_categories where family_id = p_id and status = 'active') then raise exception 'family_has_active_genera' using errcode = '40001'; end if;
    update public.taxon_families set status = p_status, updated_at = now(), version = version + 1 where id = p_id;
  else
    if p_status = 'active' and not exists (select 1 from public.taxon_families where id = cur->>'family_id' and status = 'active') then raise exception 'family_archived' using errcode = '40001'; end if;
    update public.taxon_categories set status = p_status, updated_at = now(), version = version + 1 where id = p_id;
  end if;
  return public.pw_record_taxon_version(p_kind, p_id, coalesce(nullif(p_note, ''), case when p_status = 'archived' then 'Archived' else 'Restored' end));
end;
$$;

-- Makes an old version's content current again, as a new version. Status is not reverted.
create or replace function public.pw_revert_taxon(p_kind text, p_id text, p_number integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  old jsonb;
begin
  if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
  select data into old from public.taxon_versions where kind = p_kind and taxon_id = p_id and number = p_number;
  if old is null then raise exception 'version_not_found' using errcode = '22023'; end if;
  return public.pw_save_taxon(p_kind, p_id, jsonb_strip_nulls(jsonb_build_object(
    'slug', old->>'slug',
    'name', jsonb_build_object('zh', old->>'name_zh', 'en', old->>'name_en'),
    'scientificName', old->>'scientific_name',
    'taxonNameZh', coalesce(old->>'taxon_name_zh', ''),
    'intro', jsonb_build_object('zh', old->>'intro_zh', 'en', old->>'intro_en'),
    'essay', old->>'essay',
    'emblemAssetId', coalesce(old->>'emblem_asset_id', ''),
    'links', old->'links',
    'leadId', coalesce(old->>'lead_id', ''),
    'collaboratorIds', coalesce(old->'collaborator_ids', '[]'::jsonb),
    'sortOrder', (old->>'sort_order')::integer,
    'familyId', old->>'family_id',
    'representativeSlug', case when p_kind = 'category' then coalesce(old->>'representative_slug', '') end
  )), 'Reverted to version ' || p_number, null);
end;
$$;

revoke execute on function public.pw_save_taxon(text, text, jsonb, text, integer) from public, anon;
revoke execute on function public.pw_set_taxon_status(text, text, text, text) from public, anon;
revoke execute on function public.pw_revert_taxon(text, text, integer) from public, anon;
grant execute on function public.pw_save_taxon(text, text, jsonb, text, integer) to authenticated;
grant execute on function public.pw_set_taxon_status(text, text, text, text) to authenticated;
grant execute on function public.pw_revert_taxon(text, text, integer) to authenticated;

-- ── Entries: the catalogue place travels with the revision ──────────────────

/*
 * The place a revision files an entry at: metadata may change it, anything it
 * leaves out keeps the base place. Raises on a genus that is missing or
 * archived, a cross-genus reference equal to the primary genus, or a species
 * outside the genus.
 */
create or replace function public.pw_entry_filing(p_metadata jsonb, p_base jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  m jsonb := coalesce(p_metadata, '{}'::jsonb);
  b jsonb := coalesce(p_base, '{}'::jsonb);
  category text := coalesce(nullif(m->>'categoryId', ''), nullif(b->>'categoryId', ''));
  genus text;
  aux jsonb := coalesce(m->'auxiliaryCategoryIds', b->'auxiliaryCategoryIds', '[]'::jsonb);
  species text := nullif(trim(coalesce(m->>'species', b->>'species', '')), '');
  level text := coalesce(nullif(m->>'level', ''), nullif(b->>'level', ''), 'concept');
  content_role text := coalesce(nullif(m->>'contentRole', ''), nullif(b->>'contentRole', ''), 'foundation');
begin
  select scientific_name into genus from public.taxon_categories where id = category and status = 'active';
  if genus is null then raise exception 'invalid_category' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements_text(aux) a where a = category) then raise exception 'auxiliary_equals_primary' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements_text(aux) a where not exists (select 1 from public.taxon_categories c where c.id = a and c.status = 'active')) then raise exception 'invalid_auxiliary_category' using errcode = '22023'; end if;
  if species is not null and species not like genus || ' %' then raise exception 'species_outside_genus' using errcode = '22023'; end if;
  if level not in ('intro', 'concept', 'practice', 'reference') then raise exception 'invalid_level' using errcode = '22023'; end if;
  if content_role not in ('foundation', 'method', 'tool', 'case', 'perspective') then raise exception 'invalid_content_role' using errcode = '22023'; end if;
  return jsonb_build_object(
    'categoryId', category,
    'auxiliaryCategoryIds', coalesce((select jsonb_agg(distinct a) from jsonb_array_elements_text(aux) a), '[]'::jsonb),
    'species', species,
    'level', level,
    'contentRole', content_role
  );
end;
$$;
revoke execute on function public.pw_entry_filing(jsonb, jsonb) from public, anon, authenticated;

-- The genus an older client means by a phylum (same table as src/lib/taxonomy/legacy.ts).
create or replace function public.pw_legacy_domain_category(p_domain text)
returns text language sql stable security definer set search_path = '' as $$
  select case p_domain
    when 'theory' then 'computing-theory'
    when 'systems' then 'operating-systems'
    when 'architecture' then 'computer-architecture'
    when 'networking' then 'networks-protocols'
    when 'distributed' then 'distributed-systems'
    when 'databases' then 'databases'
    else (
      select c.id from public.taxon_categories c
      where c.status = 'active' and c.family_id = case p_domain
        when 'algorithms' then 'computing-foundations'
        when 'languages' then 'software-development'
        when 'ml' then 'ai'
        when 'security' then 'security-reliability'
      end
      order by c.sort_order limit 1
    )
  end;
$$;

-- The catalogue place a revision stored, falling back to the entry's published place.
create or replace function public.pw_revision_filing(p_entry public.entries, p_revision_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select r.metadata->'taxonomy' from public.entry_revisions r where r.id = p_revision_id and r.metadata ? 'taxonomy'),
    jsonb_build_object(
      'categoryId', p_entry.category_id,
      'auxiliaryCategoryIds', coalesce((select jsonb_agg(a.category_id) from public.entry_auxiliary_categories a where a.entry_id = p_entry.id), '[]'::jsonb),
      'species', p_entry.species,
      'level', p_entry.level,
      'contentRole', p_entry.content_role
    )
  );
$$;
revoke execute on function public.pw_revision_filing(public.entries, text) from public, anon, authenticated;

drop function if exists public.pw_save_draft(text, text, text, text, text, text, text, text, integer, jsonb);
create or replace function public.pw_save_draft(
  p_entry_id text, p_domain text, p_title_zh text, p_title_en text,
  p_summary_zh text, p_summary_en text, p_body text, p_note text,
  p_base_revision integer, p_metadata jsonb default '{}'::jsonb, p_category_id text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  now_at timestamptz := now();
  actor text := public.pw_bound_author();
  metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  filing jsonb;
begin
  if actor is null then raise exception 'author_required' using errcode = '42501'; end if;
  if p_entry_id is null then
    if p_domain is not null and p_domain not in ('algorithms', 'theory', 'languages', 'systems', 'architecture', 'networking', 'distributed', 'databases', 'ml', 'security') then raise exception 'invalid_domain' using errcode = '22023'; end if;
    filing := public.pw_entry_filing(metadata, jsonb_build_object('categoryId', coalesce(p_category_id, public.pw_legacy_domain_category(p_domain))));
    p_entry_id := 'PW-' || lpad((coalesce((select max(nullif(regexp_replace(id, '\D', '', 'g'), '')::integer) from public.entries), 0) + 1)::text, 4, '0');
    -- A new entry is not public until a revision is published, so its genus can be set now.
    insert into public.entries(id, slug, title_zh, title_en, summary_zh, summary_en, domain, category_id, species, level, content_role, scale, role, status, author_id, created_at, updated_at, latest_revision_number, hero_asset_id)
    values (p_entry_id, regexp_replace(lower(p_title_en), '[^a-z0-9]+', '-', 'g'), p_title_zh, p_title_en, p_summary_zh, p_summary_en, p_domain, filing->>'categoryId', filing->>'species', filing->>'level', filing->>'contentRole', coalesce(metadata->>'scale', 'micro'), coalesce(metadata->>'role', 'observer'), 'draft', actor, now_at, now_at, 0, nullif(metadata->>'heroAssetId', '')) returning * into e;
    insert into public.entry_auxiliary_categories(entry_id, category_id) select e.id, value from jsonb_array_elements_text(filing->'auxiliaryCategoryIds');
  else
    select * into e from public.entries where id = p_entry_id for update;
    if not found then raise exception 'entry_not_found' using errcode = '22023'; end if;
    if e.author_id <> actor and not public.pw_can_manage() then raise exception 'forbidden' using errcode = '42501'; end if;
    if p_base_revision is not null and p_base_revision <> e.latest_revision_number then raise exception 'revision_conflict' using errcode = '40001'; end if;
    filing := public.pw_entry_filing(metadata, public.pw_revision_filing(e, e.id || '@r' || e.latest_revision_number));
    update public.entries set title_zh = p_title_zh, title_en = p_title_en, summary_zh = p_summary_zh, summary_en = p_summary_en, scale = coalesce(metadata->>'scale', scale), role = coalesce(metadata->>'role', role), analogue_name_zh = metadata #>> '{analogue,name,zh}', analogue_name_en = metadata #>> '{analogue,name,en}', analogue_note_zh = metadata #>> '{analogue,note,zh}', analogue_note_en = metadata #>> '{analogue,note,en}', hero_asset_id = nullif(metadata->>'heroAssetId', ''), status = 'draft', updated_at = now_at where id = p_entry_id returning * into e;
  end if;
  metadata := metadata || jsonb_build_object('taxonomy', filing);
  n := e.latest_revision_number + 1;
  rid := e.id || '@r' || n;
  insert into public.entry_revisions(id, entry_id, number, parent_id, author_id, note, state, metadata) values (rid, e.id, n, case when n > 1 then e.id || '@r' || (n - 1) end, actor, coalesce(nullif(p_note, ''), 'Save draft'), 'draft', metadata);
  insert into public.entry_revision_bodies(revision_id, body) values (rid, p_body);
  delete from public.entry_contributors where entry_id = e.id;
  insert into public.entry_contributors(entry_id, author_id) select e.id, value from jsonb_array_elements_text(coalesce(metadata->'contributorIds', '[]'::jsonb)) where value <> actor;
  delete from public.entry_sources where entry_id = e.id;
  insert into public.entry_sources(entry_id, source_id) select e.id, value from jsonb_array_elements_text(coalesce(metadata->'sourceIds', '[]'::jsonb));
  delete from public.entry_tags where entry_id = e.id;
  insert into public.entry_tags(entry_id, tag_id) select e.id, value from jsonb_array_elements_text(coalesce(metadata->'tagIds', '[]'::jsonb));
  update public.entries set latest_revision_number = n, updated_at = now_at where id = e.id;
  perform public.pw_audit_insert('save_revision', 'entry', e.id, to_jsonb(e), jsonb_build_object('revision', rid, 'metadata', metadata));
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', case when n > 1 then e.id || '@r' || (n - 1) end, 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), 'Save draft'), 'state', 'draft', 'taxonomy', filing, 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;
revoke execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer, jsonb, text) from public, anon;
grant execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer, jsonb, text) to authenticated;

drop function if exists public.pw_transition_entry(text, text, text, text);
create or replace function public.pw_transition_entry(
  p_entry_id text, p_action text, p_target_revision_id text, p_note text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  source_id text;
  source_body text;
  metadata jsonb := '{}'::jsonb;
  filing jsonb;
  actor text := public.pw_bound_author();
  now_at timestamptz := now();
  next_state text;
  relation_item jsonb;
begin
  if actor is null then raise exception 'author_required' using errcode = '42501'; end if;
  select * into e from public.entries where id = p_entry_id for update;
  if not found then raise exception 'entry_not_found' using errcode = '22023'; end if;
  if p_action = 'submit' then
    if e.author_id <> actor and not public.pw_can_manage() then raise exception 'forbidden' using errcode = '42501'; end if;
    if e.status <> 'draft' then raise exception 'invalid_transition' using errcode = '40001'; end if;
    next_state := 'in_review';
    source_id := e.id || '@r' || e.latest_revision_number;
  elsif p_action in ('publish', 'rollback') then
    if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
    if p_action = 'publish' and e.status <> 'in_review' then raise exception 'invalid_transition' using errcode = '40001'; end if;
    source_id := case when p_action = 'rollback' then p_target_revision_id else e.id || '@r' || e.latest_revision_number end;
    next_state := 'published';
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  select b.body, r.metadata into source_body, metadata from public.entry_revision_bodies b join public.entry_revisions r on r.id = b.revision_id where b.revision_id = source_id and r.entry_id = e.id;
  if source_body is null then raise exception 'revision_not_found' using errcode = '22023'; end if;
  -- Re-check the stored place: its genus may have been archived since the draft was saved.
  filing := public.pw_entry_filing(null, public.pw_revision_filing(e, source_id));
  metadata := coalesce(metadata, '{}'::jsonb) || jsonb_build_object('taxonomy', filing);
  n := e.latest_revision_number + 1;
  rid := e.id || '@r' || n;
  insert into public.entry_revisions(id, entry_id, number, parent_id, author_id, note, state, metadata) values (rid, e.id, n, e.id || '@r' || e.latest_revision_number, actor, coalesce(nullif(p_note, ''), p_action), next_state, metadata);
  insert into public.entry_revision_bodies(revision_id, body) values (rid, source_body);
  update public.entries set status = next_state, latest_revision_number = n, published_revision_number = case when next_state = 'published' then n else published_revision_number end, scale = coalesce(metadata->>'scale', scale), role = coalesce(metadata->>'role', role), analogue_name_zh = coalesce(metadata #>> '{analogue,name,zh}', analogue_name_zh), analogue_name_en = coalesce(metadata #>> '{analogue,name,en}', analogue_name_en), analogue_note_zh = coalesce(metadata #>> '{analogue,note,zh}', analogue_note_zh), analogue_note_en = coalesce(metadata #>> '{analogue,note,en}', analogue_note_en), hero_asset_id = coalesce(nullif(metadata->>'heroAssetId', ''), hero_asset_id), updated_at = now_at where id = e.id;
  if next_state = 'published' then
    -- Only a published revision moves the entry in the public catalogue.
    update public.entries set category_id = filing->>'categoryId', species = filing->>'species', level = filing->>'level', content_role = filing->>'contentRole' where id = e.id;
    delete from public.entry_auxiliary_categories where entry_id = e.id;
    insert into public.entry_auxiliary_categories(entry_id, category_id) select e.id, value from jsonb_array_elements_text(filing->'auxiliaryCategoryIds');
  end if;
  if metadata ? 'relationDrafts' then
    delete from public.relations where from_entry_id = e.id;
    for relation_item in select value from jsonb_array_elements(metadata->'relationDrafts') as items(value) loop
      if nullif(relation_item->>'to', '') is not null then
        insert into public.relations(id, from_entry_id, to_entry_id, kind, note_zh, note_en, strength) values (concat('rel-', e.id, '-', relation_item->>'to', '-', relation_item->>'kind'), e.id, relation_item->>'to', relation_item->>'kind', relation_item #>> '{note,zh}', relation_item #>> '{note,en}', greatest(1, least(3, coalesce((relation_item->>'strength')::integer, 1))) ) on conflict (from_entry_id, to_entry_id, kind) do update set note_zh = excluded.note_zh, note_en = excluded.note_en, strength = excluded.strength;
      end if;
    end loop;
  end if;
  perform public.pw_audit_insert(p_action, 'entry', e.id, to_jsonb(e), jsonb_build_object('revision', rid, 'state', next_state, 'metadata', metadata));
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', e.id || '@r' || (n - 1), 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), p_action), 'state', next_state, 'taxonomy', filing, 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;
revoke execute on function public.pw_transition_entry(text, text, text, text) from public, anon;
grant execute on function public.pw_transition_entry(text, text, text, text) to authenticated;

-- ── Search: filter by family and genus ──────────────────────────────────────

drop function if exists public.pw_search_entries(text, text, text, text, text, text, integer, integer);
create or replace function public.pw_search_entries(
  p_text text, p_domain text default null, p_scale text default null, p_status text default null,
  p_lang text default null, p_author text default null, p_limit integer default 50, p_offset integer default 0,
  p_family text default null, p_category text default null
) returns setof jsonb language sql stable security invoker set search_path = public as $$
  with candidates as (
    select e.*, coalesce(r.number, e.published_revision_number) as visible_revision, c.family_id
    from public.entries e
    left join public.taxon_categories c on c.id = e.category_id
    left join public.entry_revisions r on r.entry_id = e.id and r.number = case when e.author_id = public.pw_bound_author() or public.pw_can_manage() then e.latest_revision_number else e.published_revision_number end
    where e.deleted_at is null
      and (coalesce(p_text, '') = '' or to_tsvector('simple', concat_ws(' ', e.id, e.title_zh, e.title_en, e.summary_zh, e.summary_en, e.species)) @@ plainto_tsquery('simple', p_text) or concat_ws(' ', e.id, e.title_zh, e.title_en, e.summary_zh, e.summary_en, e.species) ilike '%' || p_text || '%')
      and (p_domain is null or e.domain = p_domain) and (p_scale is null or e.scale = p_scale)
      and (p_family is null or c.family_id = p_family) and (p_category is null or e.category_id = p_category)
      and (p_status is null or e.status = p_status) and (p_author is null or e.author_id = p_author)
    order by e.updated_at desc
    limit greatest(0, least(p_limit, 100)) offset greatest(0, p_offset)
  )
  select jsonb_build_object('entry', jsonb_build_object('id', c.id, 'slug', c.slug, 'title', jsonb_build_object('zh', c.title_zh, 'en', c.title_en), 'summary', jsonb_build_object('zh', c.summary_zh, 'en', c.summary_en), 'domain', c.domain, 'categoryId', c.category_id, 'auxiliaryCategoryIds', coalesce((select jsonb_agg(a.category_id) from public.entry_auxiliary_categories a where a.entry_id = c.id), '[]'::jsonb), 'species', c.species, 'level', c.level, 'contentRole', c.content_role, 'scale', c.scale, 'role', c.role, 'status', c.status, 'authorId', c.author_id, 'contributorIds', '[]'::jsonb, 'sourceIds', '[]'::jsonb, 'tagIds', '[]'::jsonb, 'bodyLanguages', array['zh','en'], 'createdAt', c.created_at, 'updatedAt', c.updated_at, 'revision', coalesce(c.visible_revision, 0)), 'score', 1, 'matchedFields', array['title']::text[], 'snippet', null)
  from candidates c;
$$;
grant execute on function public.pw_search_entries(text, text, text, text, text, text, integer, integer, text, text) to anon, authenticated;
