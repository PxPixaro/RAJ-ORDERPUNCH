-- Raj Order Punch performance indexes (run once in Supabase SQL Editor)
create extension if not exists pg_trgm;

create index if not exists parties_party_name_trgm_idx
on public.parties using gin (party_name gin_trgm_ops);

create index if not exists products_code_idx
on public.products (code);

create index if not exists orders_party_date_created_idx
on public.orders (party_id, order_date, created_at desc);

create index if not exists order_items_order_line_idx
on public.order_items (order_id, line_no);
