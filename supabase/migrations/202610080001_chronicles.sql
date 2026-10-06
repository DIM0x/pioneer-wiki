-- 纪行：本会的编年册。三块内容——活动本身（date/kind/title/summary/body）、
-- 涉及的人（host_ids）、以及挂在它下面的录像与资料（resources/gallery）。
-- 视频与文件一律外链存放，这里只登记标签与地址，因此没有 Storage 依赖。
-- 公开只读；写入留给管理员，v1 由 tools/seed-supabase.mjs 幂等导入 fixtures。
create table if not exists public.chronicles (
  id text primary key,
  number integer not null unique,
  date date not null,
  kind text not null check (kind in ('meeting', 'archive', 'material', 'milestone')),
  title_zh text not null,
  title_en text not null,
  summary_zh text not null,
  summary_en text not null,
  body text,
  host_ids jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  sample boolean not null default false
);

create index if not exists chronicles_date_idx on public.chronicles (date desc);

alter table public.chronicles enable row level security;

create policy "public chronicle reads" on public.chronicles for select using (true);
create policy "admins manage chronicles" on public.chronicles for all using (public.pw_can_manage()) with check (public.pw_can_manage());
