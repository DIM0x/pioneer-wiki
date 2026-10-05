create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  handle text not null unique,
  display_name_zh text not null default '读者',
  display_name_en text not null default 'Reader',
  sigil text not null,
  account_role text not null default 'reader' check (account_role in ('reader', 'admin')),
  author_id text unique,
  member_id text unique,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.pw_new_handle(raw_email text, user_uuid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  suffix integer := 0;
begin
  base := left(trim(both '-' from regexp_replace(lower(split_part(raw_email, '@', 1)), '[^a-z0-9-]+', '-', 'g')), 32);
  if base = '' then base := 'reader'; end if;
  candidate := base;
  while exists (select 1 from public.profiles p where p.handle = candidate and p.id <> user_uuid) loop
    suffix := suffix + 1;
    candidate := left(base, 26) || '-' || suffix::text;
  end loop;
  return candidate;
end;
$$;

create or replace function public.pw_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if display_name is null then display_name := 'Reader'; end if;
  insert into public.profiles (id, email, handle, display_name_zh, display_name_en, sigil)
  values (
    new.id,
    lower(new.email),
    public.pw_new_handle(new.email, new.id),
    display_name,
    display_name,
    'account:' || new.id::text
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists pw_auth_user_profile on auth.users;
create trigger pw_auth_user_profile
  after insert or update of email on auth.users
  for each row execute function public.pw_create_profile();

create or replace function public.pw_protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id and not public.pw_is_admin() then
    new.account_role := old.account_role;
    new.author_id := old.author_id;
    new.member_id := old.member_id;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.pw_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_role = 'admin'
  );
$$;

drop trigger if exists pw_profile_privileges on public.profiles;
create trigger pw_profile_privileges
  before update on public.profiles
  for each row execute function public.pw_protect_profile_privileges();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

drop policy if exists "read own profile or admin" on public.profiles;
create policy "read own profile or admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.pw_is_admin());

drop policy if exists "update own profile or admin" on public.profiles;
create policy "update own profile or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.pw_is_admin())
  with check (id = auth.uid() or public.pw_is_admin());

create or replace function public.pw_bind_author(target_user uuid, target_author text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pw_is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  if target_author is not null and exists (select 1 from public.profiles where author_id = target_author and id <> target_user) then
    raise exception 'author_already_bound' using errcode = '23505';
  end if;
  update public.profiles set author_id = target_author where id = target_user;
  if not found then raise exception 'profile_not_found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.pw_bind_member(target_user uuid, target_member text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pw_is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  if target_member is not null and exists (select 1 from public.profiles where member_id = target_member and id <> target_user) then
    raise exception 'member_already_bound' using errcode = '23505';
  end if;
  update public.profiles set member_id = target_member where id = target_user;
  if not found then raise exception 'profile_not_found' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.pw_bind_author(uuid, text) from public, anon;
revoke all on function public.pw_bind_member(uuid, text) from public, anon;
grant execute on function public.pw_bind_author(uuid, text) to authenticated;
grant execute on function public.pw_bind_member(uuid, text) to authenticated;

-- Run once after creating the initial account, replacing the address with the deployment admin email:
-- update public.profiles set account_role = 'admin' where lower(email) = lower('you@example.com');
