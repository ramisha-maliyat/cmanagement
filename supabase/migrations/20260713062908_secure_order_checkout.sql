begin;

-- =========================================================
-- 1. ORDER DISPLAY SNAPSHOTS
-- Preserve historical vendor/canteen names.
-- =========================================================

alter table public.orders
  add column if not exists vendor_name text
  not null default '';

alter table public.orders
  add column if not exists canteen_name text
  not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_vendor_name_length'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_vendor_name_length
      check (char_length(vendor_name) <= 150);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_canteen_name_length'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_canteen_name_length
      check (char_length(canteen_name) <= 150);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_notes_length'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_notes_length
      check (
        notes is null
        or char_length(notes) <= 500
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_instruction_length'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_instruction_length
      check (
        special_instruction is null
        or char_length(special_instruction) <= 500
      );
  end if;
end
$$;

-- =========================================================
-- 2. ORDER INDEX
-- =========================================================

create index if not exists
  orders_customer_status_created_index
on public.orders (
  customer_id,
  status,
  created_at desc
);

-- =========================================================
-- 3. SECURE ORDER CREATION
-- One function call = one PostgreSQL transaction.
-- =========================================================

create or replace function public.create_order(
  p_canteen_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_pickup_time timestamptz,
  p_notes text,
  p_payment_method public.payment_method,
  p_items jsonb
)
returns table (
  order_id uuid,
  order_number text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_app_role public.app_role;
  v_account_is_active boolean;

  v_canteen public.canteens%rowtype;
  v_vendor public.vendors%rowtype;
  v_menu_item public.menu_items%rowtype;

  v_category_active boolean;

  v_item jsonb;
  v_menu_item_id uuid;
  v_quantity integer;

  v_seen_item_ids uuid[] := array[]::uuid[];

  v_customer_name text;
  v_customer_phone text;
  v_notes text;

  v_subtotal numeric(12, 2) := 0;
  v_order_id uuid;
  v_order_number text;
begin
  -- -------------------------------------------------------
  -- Authenticate customer
  -- -------------------------------------------------------

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication is required.';
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
    raise exception 'Customer profile was not found.';
  end if;

  if v_account_is_active is not true then
    raise exception 'This account is disabled.';
  end if;

  if v_app_role is distinct from
     'customer'::public.app_role then

    raise exception
      'Only customer accounts can place orders.';
  end if;

  -- -------------------------------------------------------
  -- Validate customer information
  -- -------------------------------------------------------

  v_customer_name :=
    btrim(coalesce(p_customer_name, ''));

  v_customer_phone :=
    nullif(btrim(coalesce(p_customer_phone, '')), '');

  v_notes :=
    nullif(btrim(coalesce(p_notes, '')), '');

  if char_length(v_customer_name) < 2
     or char_length(v_customer_name) > 120 then

    raise exception
      'Customer name must contain between 2 and 120 characters.';
  end if;

  if v_customer_phone is not null
     and char_length(v_customer_phone) > 30 then

    raise exception
      'Customer phone number is too long.';
  end if;

  if v_notes is not null
     and char_length(v_notes) > 500 then

    raise exception
      'Order notes must not exceed 500 characters.';
  end if;

  -- Phase 9 supports cash only.

  if p_payment_method is distinct from
     'cash'::public.payment_method then

    raise exception
      'Only cash payment is currently supported.';
  end if;

  if p_pickup_time is null then
    raise exception 'Pickup time is required.';
  end if;

  if p_pickup_time < now() - interval '1 minute' then
    raise exception 'Pickup time cannot be in the past.';
  end if;

  if p_pickup_time > now() + interval '14 days' then
    raise exception
      'Pickup time cannot be more than 14 days ahead.';
  end if;

  -- -------------------------------------------------------
  -- Lock and validate canteen/vendor
  -- -------------------------------------------------------

  select canteen.*
  into v_canteen
  from public.canteens as canteen
  where canteen.id = p_canteen_id
  for share;

  if not found then
    raise exception 'Canteen was not found.';
  end if;

  if v_canteen.is_active is not true then
    raise exception 'This canteen is currently inactive.';
  end if;

  select vendor.*
  into v_vendor
  from public.vendors as vendor
  where vendor.id = v_canteen.vendor_id
  for share;

  if not found
     or v_vendor.status is distinct from
        'approved'::public.vendor_status then

    raise exception
      'This vendor is not currently accepting orders.';
  end if;

  -- -------------------------------------------------------
  -- Validate cart
  -- -------------------------------------------------------

  if p_items is null
     or jsonb_typeof(p_items) <> 'array' then

    raise exception 'Order items must be an array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'The order must contain at least one item.';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'The order contains too many items.';
  end if;

  -- First pass:
  -- validate, lock stock and calculate current subtotal.

  for v_item in
    select item.value
    from jsonb_array_elements(p_items) as item(value)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'An order item is invalid.';
    end if;

    begin
      v_menu_item_id :=
        (v_item ->> 'menuItemId')::uuid;

      v_quantity :=
        (v_item ->> 'quantity')::integer;
    exception
      when invalid_text_representation
        or numeric_value_out_of_range then

        raise exception
          'An order item contains an invalid identifier or quantity.';
    end;

    if v_menu_item_id is null then
      raise exception 'A menu item identifier is required.';
    end if;

    if v_quantity < 1 or v_quantity > 100 then
      raise exception
        'Item quantity must be between 1 and 100.';
    end if;

    if v_menu_item_id = any(v_seen_item_ids) then
      raise exception
        'The same menu item cannot appear twice.';
    end if;

    v_seen_item_ids :=
      array_append(
        v_seen_item_ids,
        v_menu_item_id
      );

    select menu_item.*
    into v_menu_item
    from public.menu_items as menu_item
    where menu_item.id = v_menu_item_id
    for update;

    if not found then
      raise exception 'A menu item was not found.';
    end if;

    if v_menu_item.vendor_id <> v_vendor.id
       or v_menu_item.canteen_id <> v_canteen.id then

      raise exception
        'All items must belong to the selected canteen.';
    end if;

    if v_menu_item.is_available is not true then
      raise exception
        'The item "%" is currently unavailable.',
        v_menu_item.name;
    end if;

    select category.is_active
    into v_category_active
    from public.menu_categories as category
    where category.id = v_menu_item.category_id
      and category.vendor_id = v_vendor.id
      and category.canteen_id = v_canteen.id
    for share;

    if not found
       or v_category_active is not true then

      raise exception
        'The category for "%" is currently inactive.',
        v_menu_item.name;
    end if;

    if v_menu_item.track_stock
       and v_quantity > v_menu_item.stock_quantity then

      raise exception
        'Insufficient stock for "%".',
        v_menu_item.name;
    end if;

    v_subtotal :=
      round(
        v_subtotal
        + (
          v_menu_item.price
          * v_quantity
        ),
        2
      );
  end loop;

  -- -------------------------------------------------------
  -- Create order
  -- -------------------------------------------------------

  insert into public.orders (
    customer_id,
    vendor_id,
    canteen_id,

    vendor_name,
    canteen_name,

    customer_name,
    customer_phone,

    status,
    payment_method,
    payment_status,
    fulfillment_type,

    currency_code,

    subtotal,
    service_fee,
    delivery_fee,
    discount_amount,
    total_amount,

    pickup_time,
    notes
  )
  values (
    v_user_id,
    v_vendor.id,
    v_canteen.id,

    v_vendor.business_name,
    v_canteen.name,

    v_customer_name,
    v_customer_phone,

    'pending'::public.order_status,
    'cash'::public.payment_method,
    'unpaid'::public.payment_status,
    'pickup'::public.fulfillment_type,

    v_vendor.currency_code,

    v_subtotal,
    0,
    0,
    0,
    v_subtotal,

    p_pickup_time,
    v_notes
  )
  returning
    public.orders.id,
    public.orders.order_number
  into
    v_order_id,
    v_order_number;

  -- -------------------------------------------------------
  -- Create snapshots and reduce stock
  -- -------------------------------------------------------

  for v_item in
    select item.value
    from jsonb_array_elements(p_items) as item(value)
  loop
    v_menu_item_id :=
      (v_item ->> 'menuItemId')::uuid;

    v_quantity :=
      (v_item ->> 'quantity')::integer;

    select menu_item.*
    into v_menu_item
    from public.menu_items as menu_item
    where menu_item.id = v_menu_item_id;

    insert into public.order_items (
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price
    )
    values (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_quantity,
      v_menu_item.price
    );

    if v_menu_item.track_stock then
      update public.menu_items
      set stock_quantity =
        stock_quantity - v_quantity
      where id = v_menu_item.id;
    end if;
  end loop;

  return query
  select
    v_order_id,
    v_order_number,
    v_subtotal;
end;
$$;

-- =========================================================
-- 4. RPC PERMISSIONS
-- =========================================================

revoke all
on function public.create_order(
  uuid,
  text,
  text,
  timestamptz,
  text,
  public.payment_method,
  jsonb
)
from public;

revoke all
on function public.create_order(
  uuid,
  text,
  text,
  timestamptz,
  text,
  public.payment_method,
  jsonb
)
from anon;

grant execute
on function public.create_order(
  uuid,
  text,
  text,
  timestamptz,
  text,
  public.payment_method,
  jsonb
)
to authenticated;

commit;