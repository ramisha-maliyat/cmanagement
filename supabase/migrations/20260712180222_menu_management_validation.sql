begin;

-- =========================================================
-- 1. CATEGORY VALIDATION LIMITS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_categories_display_order_max'
      and conrelid = 'public.menu_categories'::regclass
  ) then
    alter table public.menu_categories
      add constraint menu_categories_display_order_max
      check (display_order <= 10000);
  end if;
end
$$;

-- =========================================================
-- 2. MENU ITEM VALIDATION LIMITS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_description_length'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_description_length
      check (
        description is null
        or char_length(description) <= 2000
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_image_url_length'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_image_url_length
      check (
        image_url is null
        or char_length(image_url) <= 2048
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_price_max'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_price_max
      check (price <= 999999.99);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_stock_max'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_stock_max
      check (stock_quantity <= 1000000);
  end if;
end
$$;

-- =========================================================
-- 3. MENU MANAGEMENT INDEXES
-- =========================================================

create index if not exists
  menu_categories_vendor_canteen_order_index
on public.menu_categories (
  vendor_id,
  canteen_id,
  display_order,
  created_at
);

create index if not exists
  menu_items_vendor_canteen_category_index
on public.menu_items (
  vendor_id,
  canteen_id,
  category_id,
  is_available
);

commit;