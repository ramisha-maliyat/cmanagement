begin;

-- =========================================================
-- 1. ORDER STATUS HISTORY FIELDS
-- =========================================================

alter table public.orders
  add column if not exists status_updated_at timestamptz
  not null default now();

alter table public.orders
  add column if not exists accepted_at timestamptz;

alter table public.orders
  add column if not exists preparing_at timestamptz;

alter table public.orders
  add column if not exists ready_at timestamptz;

alter table public.orders
  add column if not exists completed_at timestamptz;

alter table public.orders
  add column if not exists rejected_at timestamptz;

alter table public.orders
  add column if not exists rejection_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_rejection_reason_length'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_rejection_reason_length
      check (
        rejection_reason is null
        or char_length(rejection_reason) <= 500
      );
  end if;
end
$$;

-- =========================================================
-- 2. VENDOR ORDER INDEX
-- =========================================================

create index if not exists
  orders_vendor_status_created_index
on public.orders (
  vendor_id,
  status,
  created_at desc
);

create index if not exists
  order_items_order_id_index
on public.order_items (
  order_id
);

-- =========================================================
-- 3. VENDOR ORDER READ POLICIES
-- These are additional permissive SELECT policies.
-- Existing customer policies remain unchanged.
-- =========================================================

drop policy if exists phase10_vendor_orders_read
  on public.orders;

create policy phase10_vendor_orders_read
on public.orders
for select
to authenticated
using (
  public.can_manage_vendor(vendor_id)
);

drop policy if exists phase10_vendor_order_items_read
  on public.order_items;

create policy phase10_vendor_order_items_read
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders as order_record
    where order_record.id = order_items.order_id
      and public.can_manage_vendor(
        order_record.vendor_id
      )
  )
);

-- =========================================================
-- 4. SECURE ORDER STATUS TRANSITION FUNCTION
-- =========================================================

create or replace function public.update_vendor_order_status(
  p_order_id uuid,
  p_next_status public.order_status,
  p_rejection_reason text default null
)
returns table (
  updated_order_id uuid,
  new_status public.order_status,
  changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_app_role public.app_role;
  v_account_is_active boolean;

  v_order public.orders%rowtype;
  v_vendor public.vendors%rowtype;

  v_rejection_reason text;
  v_now timestamptz := now();
begin
  -- -------------------------------------------------------
  -- Authenticate vendor user
  -- -------------------------------------------------------

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication is required.';
  end if;

  select
    profile.role,
    profile.is_active
  into
    v_app_role,
    v_account_is_active
  from public.profiles as profile
  where profile.id = v_user_id;

  if not found then
    raise exception
      'Application profile was not found.';
  end if;

  if v_account_is_active is not true then
    raise exception
      'This account is disabled.';
  end if;

  if v_app_role is distinct from
     'vendor'::public.app_role then

    raise exception
      'Only vendor accounts can manage orders.';
  end if;

  -- -------------------------------------------------------
  -- Lock order
  -- -------------------------------------------------------

  select order_record.*
  into v_order
  from public.orders as order_record
  where order_record.id = p_order_id
  for update;

  if not found then
    raise exception
      'Order was not found.';
  end if;

  -- -------------------------------------------------------
  -- Confirm ownership and approval
  -- -------------------------------------------------------

  select vendor_record.*
  into v_vendor
  from public.vendors as vendor_record
  where vendor_record.id = v_order.vendor_id
    and vendor_record.owner_id = v_user_id
  for share;

  if not found then
    raise exception
      'You do not have permission to manage this order.';
  end if;

  if v_vendor.status is distinct from
     'approved'::public.vendor_status then

    raise exception
      'The vendor account is not currently approved.';
  end if;

  -- -------------------------------------------------------
  -- Validate transition
  -- -------------------------------------------------------

  if v_order.status = 'pending'::public.order_status then
    if p_next_status not in (
      'accepted'::public.order_status,
      'rejected'::public.order_status
    ) then
      raise exception
        'A pending order can only be accepted or rejected.';
    end if;

  elsif v_order.status = 'accepted'::public.order_status then
    if p_next_status not in (
      'preparing'::public.order_status,
      'rejected'::public.order_status
    ) then
      raise exception
        'An accepted order can only start preparation or be rejected.';
    end if;

  elsif v_order.status = 'preparing'::public.order_status then
    if p_next_status is distinct from
       'ready'::public.order_status then
      raise exception
        'A preparing order can only be marked ready.';
    end if;

  elsif v_order.status = 'ready'::public.order_status then
    if p_next_status is distinct from
       'completed'::public.order_status then
      raise exception
        'A ready order can only be completed.';
    end if;

  else
    raise exception
      'This order can no longer be changed.';
  end if;

  -- -------------------------------------------------------
  -- Validate rejection reason
  -- -------------------------------------------------------

  v_rejection_reason :=
    nullif(
      btrim(
        coalesce(
          p_rejection_reason,
          ''
        )
      ),
      ''
    );

  if p_next_status =
     'rejected'::public.order_status then

    if v_rejection_reason is null
       or char_length(v_rejection_reason) < 3 then

      raise exception
        'A rejection reason of at least 3 characters is required.';
    end if;

    if char_length(v_rejection_reason) > 500 then
      raise exception
        'Rejection reason must not exceed 500 characters.';
    end if;
  end if;

  -- -------------------------------------------------------
  -- Restore stock when rejecting
  -- Stock was reduced during secure order creation.
  -- This transition can only happen once because the
  -- order row is locked and terminal statuses cannot move.
  -- -------------------------------------------------------

  if p_next_status =
     'rejected'::public.order_status then

    update public.menu_items as menu_item
    set stock_quantity =
      menu_item.stock_quantity
      + order_item.quantity
    from public.order_items as order_item
    where order_item.order_id = v_order.id
      and order_item.menu_item_id = menu_item.id
      and menu_item.track_stock = true;
  end if;

  -- -------------------------------------------------------
  -- Update status and timestamps
  -- -------------------------------------------------------

  update public.orders
  set
    status = p_next_status,

    status_updated_at = v_now,

    accepted_at =
      case
        when p_next_status =
             'accepted'::public.order_status
          then v_now
        else accepted_at
      end,

    preparing_at =
      case
        when p_next_status =
             'preparing'::public.order_status
          then v_now
        else preparing_at
      end,

    ready_at =
      case
        when p_next_status =
             'ready'::public.order_status
          then v_now
        else ready_at
      end,

    completed_at =
      case
        when p_next_status =
             'completed'::public.order_status
          then v_now
        else completed_at
      end,

    rejected_at =
      case
        when p_next_status =
             'rejected'::public.order_status
          then v_now
        else rejected_at
      end,

    rejection_reason =
      case
        when p_next_status =
             'rejected'::public.order_status
          then v_rejection_reason
        else rejection_reason
      end

  where id = v_order.id;

  return query
  select
    v_order.id,
    p_next_status,
    v_now;
end;
$$;

-- =========================================================
-- 5. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.update_vendor_order_status(
  uuid,
  public.order_status,
  text
)
from public;

revoke all
on function public.update_vendor_order_status(
  uuid,
  public.order_status,
  text
)
from anon;

grant execute
on function public.update_vendor_order_status(
  uuid,
  public.order_status,
  text
)
to authenticated;

commit;