begin;

-- =========================================================
-- 1. CANTEEN FIELD LIMITS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'canteens_description_length'
      and conrelid = 'public.canteens'::regclass
  ) then
    alter table public.canteens
      add constraint canteens_description_length
      check (
        description is null
        or char_length(description) <= 1000
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'canteens_location_length'
      and conrelid = 'public.canteens'::regclass
  ) then
    alter table public.canteens
      add constraint canteens_location_length
      check (
        location is null
        or char_length(location) <= 500
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'canteens_timezone_length'
      and conrelid = 'public.canteens'::regclass
  ) then
    alter table public.canteens
      add constraint canteens_timezone_length
      check (
        char_length(timezone) >= 1
        and char_length(timezone) <= 100
      );
  end if;
end
$$;

-- =========================================================
-- 2. APPROVED-VENDOR SECURITY HELPER
-- Only an approved, active vendor can manage business data.
-- Admins retain access.
-- =========================================================

create or replace function public.can_manage_vendor(
  p_vendor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.vendors as vendor
      join public.profiles as profile
        on profile.id = vendor.owner_id
      where vendor.id = p_vendor_id
        and vendor.owner_id = auth.uid()
        and vendor.status =
          'approved'::public.vendor_status
        and profile.role =
          'vendor'::public.app_role
        and profile.is_active = true
    );
$$;

revoke all
on function public.can_manage_vendor(uuid)
from public;

revoke all
on function public.can_manage_vendor(uuid)
from anon;

grant execute
on function public.can_manage_vendor(uuid)
to authenticated;

-- =========================================================
-- 3. REPLACE CANTEEN MANAGEMENT POLICIES
-- =========================================================

drop policy if exists canteens_private_read
  on public.canteens;

drop policy if exists canteens_insert
  on public.canteens;

drop policy if exists canteens_update
  on public.canteens;

drop policy if exists canteens_delete
  on public.canteens;

create policy canteens_private_read
on public.canteens
for select
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

create policy canteens_insert
on public.canteens
for insert
to authenticated
with check (
  public.can_manage_vendor(vendor_id)
);

create policy canteens_update
on public.canteens
for update
to authenticated
using (
  public.can_manage_vendor(vendor_id)
)
with check (
  public.can_manage_vendor(vendor_id)
);

create policy canteens_delete
on public.canteens
for delete
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

-- =========================================================
-- 4. SECURE FUTURE CATEGORY POLICIES
-- This prevents pending customers from creating menu data.
-- =========================================================

drop policy if exists categories_private_read
  on public.menu_categories;

drop policy if exists categories_insert
  on public.menu_categories;

drop policy if exists categories_update
  on public.menu_categories;

drop policy if exists categories_delete
  on public.menu_categories;

create policy categories_private_read
on public.menu_categories
for select
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

create policy categories_insert
on public.menu_categories
for insert
to authenticated
with check (
  public.can_manage_vendor(vendor_id)
);

create policy categories_update
on public.menu_categories
for update
to authenticated
using (
  public.can_manage_vendor(vendor_id)
)
with check (
  public.can_manage_vendor(vendor_id)
);

create policy categories_delete
on public.menu_categories
for delete
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

-- =========================================================
-- 5. SECURE FUTURE MENU-ITEM POLICIES
-- =========================================================

drop policy if exists items_private_read
  on public.menu_items;

drop policy if exists items_insert
  on public.menu_items;

drop policy if exists items_update
  on public.menu_items;

drop policy if exists items_delete
  on public.menu_items;

create policy items_private_read
on public.menu_items
for select
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

create policy items_insert
on public.menu_items
for insert
to authenticated
with check (
  public.can_manage_vendor(vendor_id)
);

create policy items_update
on public.menu_items
for update
to authenticated
using (
  public.can_manage_vendor(vendor_id)
)
with check (
  public.can_manage_vendor(vendor_id)
);

create policy items_delete
on public.menu_items
for delete
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

commit;