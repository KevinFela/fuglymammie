-- FUGLYMAMMIE EDITORIAL POSTS - run ONCE in the SQL Editor of the
-- Fuglymammie project shown in script.js (NOT the unrelated IMBUZII project).
-- Keep existing events, subscribers, admins, event-media and policies intact.

create table if not exists public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  post_date date not null default current_date,
  body text not null default '' check (char_length(body) <= 20000),
  image_url text,
  video_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists editorial_posts_public_date_idx
  on public.editorial_posts (post_date desc, created_at desc)
  where published = true;

alter table public.editorial_posts enable row level security;
-- Only published posts are visible to visitors. Existing Fuglymammie admins
-- can also list drafts (the existing admins table is the source of truth).
create policy fm_editorial_read_published
  on public.editorial_posts for select to anon, authenticated
  using (published = true);
create policy fm_editorial_read_admin
  on public.editorial_posts for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy fm_editorial_insert_admin
  on public.editorial_posts for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy fm_editorial_update_admin
  on public.editorial_posts for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy fm_editorial_delete_admin
  on public.editorial_posts for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

revoke all on public.editorial_posts from public, anon, authenticated;
grant select on public.editorial_posts to anon;
grant select, insert, update, delete on public.editorial_posts to authenticated;

-- Keep editorial uploads separate from existing event posters. Public
-- visibility is intentional: published photographs must display on the site.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editorial-media','editorial-media',true,8 * 1024 * 1024,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

create policy fm_editorial_media_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'editorial-media');
create policy fm_editorial_media_insert_admin
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'editorial-media'
    and (storage.foldername(name))[1] = 'posts'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
create policy fm_editorial_media_delete_admin
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'editorial-media'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
