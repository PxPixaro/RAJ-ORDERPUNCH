-- OPTIONAL SECURITY UPGRADE FOR RAJ ORDER PUNCH
-- Your current setup allows anon to execute sync_products/sync_parties.
-- Before sharing admin.html publicly, use Supabase Auth + an admin allow-list.
--
-- 1) Create an admin user in Supabase Dashboard -> Authentication -> Users.
-- 2) Copy that user's UUID.
-- 3) Replace YOUR_ADMIN_USER_UUID below and run this file in SQL Editor.
-- 4) admin.html currently does NOT contain a login screen; if you enable this patch,
--    add Supabase Auth login or run sync from a trusted authenticated admin tool.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.app_admins(user_id)
values ('YOUR_ADMIN_USER_UUID'::uuid)
on conflict do nothing;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.app_admins where user_id = auth.uid());
$$;

-- Make read access work both anonymously and while authenticated.
drop policy if exists "public read products authenticated" on public.products;
create policy "public read products authenticated" on public.products for select to authenticated using (true);
drop policy if exists "public read parties authenticated" on public.parties;
create policy "public read parties authenticated" on public.parties for select to authenticated using (true);
drop policy if exists "public read orders authenticated" on public.orders;
create policy "public read orders authenticated" on public.orders for select to authenticated using (true);
drop policy if exists "public read order_items authenticated" on public.order_items;
create policy "public read order_items authenticated" on public.order_items for select to authenticated using (true);
drop policy if exists "public read stock_movements authenticated" on public.stock_movements;
create policy "public read stock_movements authenticated" on public.stock_movements for select to authenticated using (true);

grant execute on function public.punch_order(uuid,jsonb) to authenticated;

-- After you add an admin-check inside the sync functions, revoke anonymous access:
-- revoke execute on function public.sync_products(jsonb) from anon;
-- revoke execute on function public.sync_parties(jsonb) from anon;
-- grant execute on function public.sync_products(jsonb) to authenticated;
-- grant execute on function public.sync_parties(jsonb) to authenticated;
--
-- NOTE: Do not revoke anon sync until admin.html is upgraded with Auth login.
