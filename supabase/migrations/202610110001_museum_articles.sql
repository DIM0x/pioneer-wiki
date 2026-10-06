-- Museum articles: the 53 species articles bring sources that have no
-- publication year (documentation, living standards) and the verified names
-- of the catalogue. Additive; rolling back means re-adding the NOT NULL after
-- filling the years and dropping taxon_snapshots (nothing else references it).

-- A source without a year keeps no invented one.
alter table public.sources alter column year drop not null;

-- 分类快照 — a name as checked against Catalogue of Life (or the specialist
-- database COL defers to), frozen when the catalogue was published. The site
-- reads these and never queries the checklists at run time. Written by the
-- service-role seed only; readers may read all of it.
create table if not exists public.taxon_snapshots (
  scientific_name text primary key,
  rank text not null check (rank in ('family', 'genus', 'species')),
  accepted_name text not null,
  authority text not null default '',
  synonyms text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  verified_at timestamptz not null
);

comment on table public.taxon_snapshots is
  'Published name snapshots keyed by scientific name: authority, accepted name and the checklist records (COL release, AlgaeBase via WoRMS, GBIF, NCBI) they were checked against.';

alter table public.taxon_snapshots enable row level security;
drop policy if exists "public reads taxon snapshots" on public.taxon_snapshots;
create policy "public reads taxon snapshots" on public.taxon_snapshots for select using (true);
