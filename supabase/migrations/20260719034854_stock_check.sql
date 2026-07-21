begin;

-- =========================================================
-- STOCK CHECK (STOCKTAKE) SESSIONS
-- One row per stocktake event, e.g. "Weekly count - 19 Jul"
-- =========================================================
create table if not exists public.stock_checks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  checked_by uuid references auth.users(id),
  status text check (status in ('in_progress', 'completed')) not null default 'in_progress',
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- =========================================================
-- STOCK CHECK LINES
-- One row per item counted within a stock check session
-- =========================================================
create table if not exists public.stock_check_items (
  id uuid primary key default gen_random_uuid(),
  stock_check_id uuid references public.stock_checks(id) on delete cascade,
  item_id uuid references public.menu_items(id) on delete cascade,
  system_quantity numeric not null,   -- what current_stock said at time of count
  counted_quantity numeric not null,  -- what staff physically counted
  difference numeric generated always as (counted_quantity - system_quantity) stored,
  note text,
  created_at timestamptz default now(),

  unique (stock_check_id, item_id)
);

-- =========================================================
-- INDEXES
-- =========================================================
create index if not exists idx_stock_check_items_stock_check_id
  on public.stock_check_items (stock_check_id);

create index if not exists idx_stock_check_items_item_id
  on public.stock_check_items (item_id);

-- =========================================================
-- VIEW: latest stock check summary (optional, handy for reports)
-- =========================================================
create or replace view public.stock_check_summary as
select
  sc.id as stock_check_id,
  sc.title,
  sc.status,
  sc.created_at,
  sc.completed_at,
  sci.item_id,
  ii.name as item_name,
  ii.unit,
  sci.system_quantity,
  sci.counted_quantity,
  sci.difference
from public.stock_checks sc
join public.stock_check_items sci on sci.stock_check_id = sc.id
join public.menu_items ii on ii.id = sci.item_id;

commit;