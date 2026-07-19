begin;

-- =========================================================
-- Stock check processing: movements, apply function, RPC and trigger
-- Updates menu_items.stock_quantity when a stock_check is completed
-- =========================================================

-- Movements table for auditing stock changes
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid,
  menu_item_id uuid,
  change numeric not null,
  previous numeric,
  new numeric,
  reason text,
  source_table text,
  source_id uuid,
  created_at timestamptz not null default now()
);

-- Function: apply a stock_check to update menu_items and write movements
create or replace function public.apply_stock_check(p_check_id uuid) returns void as $$
declare
  rec record;
  prev_qty numeric;
  v_vendor uuid;
begin
  for rec in select * from public.stock_check_items where stock_check_id = p_check_id
  loop
    -- lock the menu_item row if it exists and read previous quantity + vendor
    select stock_quantity, vendor_id into prev_qty, v_vendor
      from public.menu_items where id = rec.item_id for update;

    if found then
      update public.menu_items
      set stock_quantity = rec.counted_quantity,
          updated_at = now()
      where id = rec.item_id;

      insert into public.stock_movements (menu_item_id, vendor_id, change, previous, new, reason, source_table, source_id)
      values (rec.item_id, v_vendor, rec.counted_quantity - coalesce(prev_qty, 0), coalesce(prev_qty, 0), rec.counted_quantity, 'stock_check', 'stock_checks', p_check_id);
    else
      -- menu_item not found; still record a movement for traceability
      insert into public.stock_movements (menu_item_id, vendor_id, change, previous, new, reason, source_table, source_id)
      values (rec.item_id, null, rec.counted_quantity - coalesce(prev_qty, 0), coalesce(prev_qty, 0), rec.counted_quantity, 'stock_check_missing_item', 'stock_checks', p_check_id);
    end if;
  end loop;

  -- mark the stock_check completed (idempotent if already completed)
  update public.stock_checks set status = 'completed', completed_at = now() where id = p_check_id;
end;
$$ language plpgsql security definer;

-- Trigger function: call apply_stock_check when status transitions to completed
create or replace function public.stock_check_status_change_trigger() returns trigger as $$
begin
  if new.status = 'completed' and (old.status is distinct from new.status) then
    perform public.apply_stock_check(new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger
drop trigger if exists trg_stock_check_status_change on public.stock_checks;
create trigger trg_stock_check_status_change
after update on public.stock_checks
for each row
when (old.status is distinct from new.status)
execute function public.stock_check_status_change_trigger();

-- RPC: create a stock_check with items and optionally auto-complete (apply)
create or replace function public.create_stock_check_with_items(
  p_title text,
  p_checked_by uuid,
  p_items jsonb,
  p_auto_complete boolean default false
) returns uuid as $$
declare
  new_id uuid := gen_random_uuid();
  item jsonb;
  product_id uuid;
  counted numeric;
begin
  insert into public.stock_checks (id, title, checked_by)
  values (new_id, p_title, p_checked_by);

  for item in select * from jsonb_array_elements(p_items)
  loop
    product_id := (item->>'item_id')::uuid;
    counted := (item->>'counted_quantity')::numeric;

    insert into public.stock_check_items (stock_check_id, item_id, system_quantity, counted_quantity)
    values (new_id, product_id, coalesce((select stock_quantity from public.menu_items where id = product_id), 0), counted)
    on conflict (stock_check_id, item_id) do update set counted_quantity = excluded.counted_quantity;
  end loop;

  if p_auto_complete then
    perform public.apply_stock_check(new_id);
  end if;

  return new_id;
end;
$$ language plpgsql security definer;

commit;
