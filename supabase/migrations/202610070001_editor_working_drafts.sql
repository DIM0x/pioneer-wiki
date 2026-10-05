alter table public.entry_revisions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.assets add column if not exists owner_id uuid references auth.users(id);
alter table public.assets add column if not exists review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected'));

create table if not exists public.entry_working_drafts (
  id uuid primary key default gen_random_uuid(),
  entry_id text references public.entries(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_id text not null references public.authors(id),
  base_revision integer,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, entry_id)
);

drop policy if exists "public asset reads" on public.assets;
create policy "public asset reads" on public.assets for select using (review_status = 'approved' or owner_id = auth.uid() or public.pw_can_manage());
create policy "authors upload pending assets" on public.assets for insert to authenticated with check (owner_id = auth.uid() and review_status = 'pending');
create policy "owners update pending assets" on public.assets for update to authenticated using (owner_id = auth.uid() or public.pw_can_manage()) with check (owner_id = auth.uid() or public.pw_can_manage());

insert into storage.buckets (id, name, public) values ('entry-assets', 'entry-assets', true) on conflict (id) do nothing;
drop policy if exists "entry assets read" on storage.objects;
create policy "entry assets read" on storage.objects for select using (bucket_id = 'entry-assets');
drop policy if exists "entry assets owner upload" on storage.objects;
create policy "entry assets owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'entry-assets' and owner = auth.uid());

alter table public.entry_working_drafts enable row level security;
create policy "owners read working drafts" on public.entry_working_drafts for select using (owner_id = auth.uid() or public.pw_can_manage());
create policy "owners write working drafts" on public.entry_working_drafts for insert with check (owner_id = auth.uid() and author_id = public.pw_bound_author());
create policy "owners update working drafts" on public.entry_working_drafts for update using (owner_id = auth.uid() or public.pw_can_manage()) with check (owner_id = auth.uid() or public.pw_can_manage());
create policy "owners delete working drafts" on public.entry_working_drafts for delete using (owner_id = auth.uid() or public.pw_can_manage());

drop function if exists public.pw_save_draft(text, text, text, text, text, text, text, text, integer);
create or replace function public.pw_save_draft(
  p_entry_id text, p_domain text, p_title_zh text, p_title_en text,
  p_summary_zh text, p_summary_en text, p_body text, p_note text,
  p_base_revision integer, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  now_at timestamptz := now();
  actor text := public.pw_bound_author();
  metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if actor is null then raise exception 'author_required' using errcode = '42501'; end if;
  if p_entry_id is null then
    if p_domain is null or p_domain not in ('algorithms', 'theory', 'languages', 'systems', 'architecture', 'networking', 'distributed', 'databases', 'ml', 'security') then raise exception 'invalid_domain' using errcode = '22023'; end if;
    p_entry_id := 'PW-' || lpad((coalesce((select max(nullif(regexp_replace(id, '\D', '', 'g'), '')::integer) from public.entries), 0) + 1)::text, 4, '0');
    insert into public.entries(id, slug, title_zh, title_en, summary_zh, summary_en, domain, scale, role, status, author_id, created_at, updated_at, latest_revision_number, hero_asset_id)
    values (p_entry_id, regexp_replace(lower(p_title_en), '[^a-z0-9]+', '-', 'g'), p_title_zh, p_title_en, p_summary_zh, p_summary_en, p_domain, coalesce(metadata->>'scale', 'micro'), coalesce(metadata->>'role', 'observer'), 'draft', actor, now_at, now_at, 0, nullif(metadata->>'heroAssetId', '')) returning * into e;
  else
    select * into e from public.entries where id = p_entry_id for update;
    if not found then raise exception 'entry_not_found' using errcode = '22023'; end if;
    if e.author_id <> actor and not public.pw_can_manage() then raise exception 'forbidden' using errcode = '42501'; end if;
    if p_base_revision is not null and p_base_revision <> e.latest_revision_number then raise exception 'revision_conflict' using errcode = '40001'; end if;
    update public.entries set title_zh = p_title_zh, title_en = p_title_en, summary_zh = p_summary_zh, summary_en = p_summary_en, scale = coalesce(metadata->>'scale', scale), role = coalesce(metadata->>'role', role), analogue_name_zh = metadata #>> '{analogue,name,zh}', analogue_name_en = metadata #>> '{analogue,name,en}', analogue_note_zh = metadata #>> '{analogue,note,zh}', analogue_note_en = metadata #>> '{analogue,note,en}', hero_asset_id = nullif(metadata->>'heroAssetId', ''), status = 'draft', updated_at = now_at where id = p_entry_id returning * into e;
  end if;
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
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', case when n > 1 then e.id || '@r' || (n - 1) end, 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), 'Save draft'), 'state', 'draft', 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;
revoke execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer, jsonb) from public, anon;
grant execute on function public.pw_save_draft(text, text, text, text, text, text, text, text, integer, jsonb) to authenticated;

drop function if exists public.pw_transition_entry(text, text, text, text);
create or replace function public.pw_transition_entry(
  p_entry_id text, p_action text, p_target_revision_id text, p_note text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.entries;
  n integer;
  rid text;
  source_body text;
  metadata jsonb := '{}'::jsonb;
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
    select b.body, r.metadata into source_body, metadata from public.entry_revision_bodies b join public.entry_revisions r on r.id = b.revision_id where b.revision_id = e.id || '@r' || e.latest_revision_number;
  elsif p_action in ('publish', 'rollback') then
    if not public.pw_can_manage() then raise exception 'admin_required' using errcode = '42501'; end if;
    if p_action = 'publish' and e.status <> 'in_review' then raise exception 'invalid_transition' using errcode = '40001'; end if;
    if p_action = 'rollback' then
      select b.body, r.metadata into source_body, metadata from public.entry_revision_bodies b join public.entry_revisions r on r.id = b.revision_id where b.revision_id = p_target_revision_id;
      if source_body is null then raise exception 'revision_not_found' using errcode = '22023'; end if;
    else
      select b.body, r.metadata into source_body, metadata from public.entry_revision_bodies b join public.entry_revisions r on r.id = b.revision_id where b.revision_id = e.id || '@r' || e.latest_revision_number;
    end if;
    next_state := 'published';
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  n := e.latest_revision_number + 1;
  rid := e.id || '@r' || n;
  insert into public.entry_revisions(id, entry_id, number, parent_id, author_id, note, state, metadata) values (rid, e.id, n, e.id || '@r' || e.latest_revision_number, actor, coalesce(nullif(p_note, ''), p_action), next_state, coalesce(metadata, '{}'::jsonb));
  insert into public.entry_revision_bodies(revision_id, body) values (rid, source_body);
  update public.entries set status = next_state, latest_revision_number = n, published_revision_number = case when next_state = 'published' then n else published_revision_number end, scale = coalesce(metadata->>'scale', scale), role = coalesce(metadata->>'role', role), analogue_name_zh = coalesce(metadata #>> '{analogue,name,zh}', analogue_name_zh), analogue_name_en = coalesce(metadata #>> '{analogue,name,en}', analogue_name_en), analogue_note_zh = coalesce(metadata #>> '{analogue,note,zh}', analogue_note_zh), analogue_note_en = coalesce(metadata #>> '{analogue,note,en}', analogue_note_en), hero_asset_id = coalesce(nullif(metadata->>'heroAssetId', ''), hero_asset_id), updated_at = now_at where id = e.id;
  if metadata ? 'relationDrafts' then
    delete from public.relations where from_entry_id = e.id;
    for relation_item in select value from jsonb_array_elements(metadata->'relationDrafts') as items(value) loop
      if nullif(relation_item->>'to', '') is not null then
        insert into public.relations(id, from_entry_id, to_entry_id, kind, note_zh, note_en, strength) values (concat('rel-', e.id, '-', relation_item->>'to', '-', relation_item->>'kind'), e.id, relation_item->>'to', relation_item->>'kind', relation_item #>> '{note,zh}', relation_item #>> '{note,en}', greatest(1, least(3, coalesce((relation_item->>'strength')::integer, 1))) ) on conflict (from_entry_id, to_entry_id, kind) do update set note_zh = excluded.note_zh, note_en = excluded.note_en, strength = excluded.strength;
      end if;
    end loop;
  end if;
  perform public.pw_audit_insert(p_action, 'entry', e.id, to_jsonb(e), jsonb_build_object('revision', rid, 'state', next_state, 'metadata', metadata));
  return jsonb_build_object('id', rid, 'entryId', e.id, 'number', n, 'parentId', e.id || '@r' || (n - 1), 'authorId', actor, 'createdAt', now_at, 'note', coalesce(nullif(p_note, ''), p_action), 'state', next_state, 'stats', jsonb_build_object('added', 0, 'removed', 0));
end;
$$;
revoke execute on function public.pw_transition_entry(text, text, text, text) from public, anon;
grant execute on function public.pw_transition_entry(text, text, text, text) to authenticated;
