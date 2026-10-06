-- Additive: existing pages keep their links and GitHub workshop. Existing
-- member-owner/admin update policies also govern this public portfolio field.
alter table public.members
  add column if not exists projects jsonb not null default '[]'::jsonb;

alter table public.members
  add constraint members_projects_array check (
    jsonb_typeof(projects) = 'array' and jsonb_array_length(projects) <= 8
  );

comment on column public.members.projects is
  'Ordered selected works with member-authored overrides and imported public preview snapshots.';
