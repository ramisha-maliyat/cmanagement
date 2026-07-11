begin;

-- =========================================================
-- 1. DATABASE ENUM TYPES
-- =========================================================

do $$
begin
  create type public.app_role as enum (
    'customer',
    'vendor',
    'admin'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.vendor_status as enum (
    'pending',
    'approved',
    'suspended',
    'rejected'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'rejected'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_method as enum (
    'cash',
    'card',
    'online'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum (
    'unpaid',
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.fulfillment_type as enum (
    'pickup',
    'delivery'
  );
exception
  when duplicate_object then null;
end
$$;

-- =========================================================
-- 2. PROFILES
-- One public profile for every Supabase Auth user
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null default '',
  phone text,
  avatar_url text,

  role public.app_role not null default 'customer',
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length
    check (char_length(full_name) <= 120),

  constraint profiles_phone_length
    check (phone is null or char_length(phone) <= 30)
);

comment on table public.profiles is
  'Public application profile associated with an auth.users account.';

-- =========================================================
-- 3. VENDORS
-- =========================================================

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null
    references public.profiles(id)
    on delete restrict,

  business_name text not null,
  slug text not null unique,
  description text,

  logo_url text,
  phone text,
  email text,
  address text,

  currency_code text not null default 'AUD',

  status public.vendor_status not null default 'pending',
  commission_rate numeric(5, 2) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vendors_business_name_not_blank
    check (char_length(btrim(business_name)) > 0),

  constraint vendors_business_name_length
    check (char_length(business_name) <= 150),

  constraint vendors_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  constraint vendors_currency_code_format
    check (currency_code ~ '^[A-Z]{3}$'),

  constraint vendors_commission_rate_range
    check (commission_rate >= 0 and commission_rate <= 100)
);

comment on table public.vendors is
  'Vendor businesses registered in the canteen management platform.';

-- =========================================================
-- 4. CANTEENS
-- A vendor can operate multiple canteens
-- =========================================================

create table if not exists public.canteens (
  id uuid primary key default gen_random_uuid(),

  vendor_id uuid not null
    references public.vendors(id)
    on delete cascade,

  name text not null,
  slug text not null,
  description text,
  location text,

  opening_time time,
  closing_time time,

  timezone text not null default 'Australia/Sydney',
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint canteens_name_not_blank
    check (char_length(btrim(name)) > 0),

  constraint canteens_name_length
    check (char_length(name) <= 150),

  constraint canteens_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  constraint canteens_vendor_slug_unique
    unique (vendor_id, slug),

  constraint canteens_id_vendor_unique
    unique (id, vendor_id)
);

comment on table public.canteens is
  'Physical or virtual canteen locations operated by vendors.';

-- =========================================================
-- 5. MENU CATEGORIES
-- =========================================================

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),

  vendor_id uuid not null,
  canteen_id uuid not null,

  name text not null,
  slug text not null,

  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint menu_categories_canteen_vendor_fk
    foreign key (canteen_id, vendor_id)
    references public.canteens(id, vendor_id)
    on delete cascade,

  constraint menu_categories_name_not_blank
    check (char_length(btrim(name)) > 0),

  constraint menu_categories_name_length
    check (char_length(name) <= 100),

  constraint menu_categories_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  constraint menu_categories_display_order_nonnegative
    check (display_order >= 0),

  constraint menu_categories_canteen_slug_unique
    unique (canteen_id, slug),

  constraint menu_categories_composite_unique
    unique (id, canteen_id, vendor_id)
);

comment on table public.menu_categories is
  'Menu groups such as Breakfast, Lunch, Snacks and Drinks.';

-- =========================================================
-- 6. MENU ITEMS
-- =========================================================

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),

  vendor_id uuid not null,
  canteen_id uuid not null,
  category_id uuid not null,

  name text not null,
  slug text not null,
  description text,

  price numeric(12, 2) not null,
  image_url text,

  preparation_minutes integer not null default 10,

  is_available boolean not null default true,
  track_stock boolean not null default false,
  stock_quantity integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint menu_items_canteen_vendor_fk
    foreign key (canteen_id, vendor_id)
    references public.canteens(id, vendor_id)
    on delete cascade,

  constraint menu_items_category_canteen_vendor_fk
    foreign key (category_id, canteen_id, vendor_id)
    references public.menu_categories(id, canteen_id, vendor_id)
    on delete cascade,

  constraint menu_items_name_not_blank
    check (char_length(btrim(name)) > 0),

  constraint menu_items_name_length
    check (char_length(name) <= 150),

  constraint menu_items_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  constraint menu_items_price_nonnegative
    check (price >= 0),

  constraint menu_items_preparation_time_range
    check (
      preparation_minutes >= 0
      and preparation_minutes <= 1440
    ),

  constraint menu_items_stock_nonnegative
    check (stock_quantity >= 0),

  constraint menu_items_canteen_slug_unique
    unique (canteen_id, slug)
);

comment on table public.menu_items is
  'Food and drink products available from a canteen menu.';

-- =========================================================
-- 7. ORDERS
-- Financial values are calculated on the server/database
-- =========================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  vendor_id uuid not null,
  canteen_id uuid not null,

  customer_name text not null,
  customer_phone text,

  status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'cash',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_type public.fulfillment_type not null default 'pickup',

  currency_code text not null default 'AUD',

  subtotal numeric(12, 2) not null default 0,
  service_fee numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,

  pickup_time timestamptz,
  delivery_address text,
  notes text,

  completed_at timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_canteen_vendor_fk
    foreign key (canteen_id, vendor_id)
    references public.canteens(id, vendor_id)
    on delete restrict,

  constraint orders_customer_name_not_blank
    check (char_length(btrim(customer_name)) > 0),

  constraint orders_currency_code_format
    check (currency_code ~ '^[A-Z]{3}$'),

  constraint orders_subtotal_nonnegative
    check (subtotal >= 0),

  constraint orders_service_fee_nonnegative
    check (service_fee >= 0),

  constraint orders_delivery_fee_nonnegative
    check (delivery_fee >= 0),

  constraint orders_discount_nonnegative
    check (discount_amount >= 0),

  constraint orders_total_nonnegative
    check (total_amount >= 0),

  constraint orders_total_calculation
    check (
      total_amount =
        subtotal
        + service_fee
        + delivery_fee
        - discount_amount
    ),

  constraint orders_delivery_address_required
    check (
      fulfillment_type <> 'delivery'
      or char_length(btrim(coalesce(delivery_address, ''))) > 0
    )
);

comment on table public.orders is
  'Customer orders with calculated totals and order status.';

-- =========================================================
-- 8. ORDER ITEMS
-- Stores a product snapshot to preserve order history
-- =========================================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  menu_item_id uuid
    references public.menu_items(id)
    on delete set null,

  item_name text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,

  line_total numeric(12, 2)
    generated always as (quantity * unit_price) stored,

  special_instruction text,

  created_at timestamptz not null default now(),

  constraint order_items_item_name_not_blank
    check (char_length(btrim(item_name)) > 0),

  constraint order_items_quantity_positive
    check (quantity > 0),

  constraint order_items_unit_price_nonnegative
    check (unit_price >= 0)
);

comment on table public.order_items is
  'Snapshot of each item included in an order.';

-- =========================================================
-- 9. PAYMENTS
-- =========================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  payment_provider text not null default 'manual',
  transaction_reference text,

  amount numeric(12, 2) not null,
  currency_code text not null default 'AUD',

  status public.payment_status not null default 'pending',
  paid_at timestamptz,

  provider_payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_provider_not_blank
    check (char_length(btrim(payment_provider)) > 0),

  constraint payments_amount_nonnegative
    check (amount >= 0),

  constraint payments_currency_code_format
    check (currency_code ~ '^[A-Z]{3}$')
);

comment on table public.payments is
  'Payment attempts and payment-provider transaction details.';

-- =========================================================
-- 10. UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at
  on public.vendors;

create trigger vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

drop trigger if exists canteens_set_updated_at
  on public.canteens;

create trigger canteens_set_updated_at
before update on public.canteens
for each row
execute function public.set_updated_at();

drop trigger if exists menu_categories_set_updated_at
  on public.menu_categories;

create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row
execute function public.set_updated_at();

drop trigger if exists menu_items_set_updated_at
  on public.menu_items;

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at
  on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at
  on public.payments;

create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

-- =========================================================
-- 11. AUTOMATIC ORDER NUMBER
-- Example: CM-20260711-A12B34CD
-- =========================================================

create or replace function public.set_order_number()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.order_number is null
     or char_length(btrim(new.order_number)) = 0 then

    new.order_number :=
      'CM-'
      || to_char(timezone('UTC', now()), 'YYYYMMDD')
      || '-'
      || upper(
        substr(
          replace(new.id::text, '-', ''),
          1,
          8
        )
      );
  end if;

  return new;
end;
$$;

drop trigger if exists orders_set_order_number
  on public.orders;

create trigger orders_set_order_number
before insert on public.orders
for each row
execute function public.set_order_number();

-- =========================================================
-- 12. AUTOMATIC PROFILE CREATION
-- Creates a profile whenever an Auth user registers
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    avatar_url
  )
  values (
    new.id,

    coalesce(
      nullif(
        btrim(new.raw_user_meta_data ->> 'full_name'),
        ''
      ),
      nullif(
        split_part(coalesce(new.email, ''), '@', 1),
        ''
      ),
      'User'
    ),

    nullif(
      btrim(new.raw_user_meta_data ->> 'phone'),
      ''
    ),

    nullif(
      btrim(new.raw_user_meta_data ->> 'avatar_url'),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
  on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.

insert into public.profiles (
  id,
  full_name,
  phone,
  avatar_url
)
select
  user_record.id,

  coalesce(
    nullif(
      btrim(user_record.raw_user_meta_data ->> 'full_name'),
      ''
    ),
    nullif(
      split_part(coalesce(user_record.email, ''), '@', 1),
      ''
    ),
    'User'
  ),

  nullif(
    btrim(user_record.raw_user_meta_data ->> 'phone'),
    ''
  ),

  nullif(
    btrim(user_record.raw_user_meta_data ->> 'avatar_url'),
    ''
  )
from auth.users as user_record
on conflict (id) do nothing;

-- =========================================================
-- 13. SECURITY HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.owns_vendor(
  target_vendor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.vendors
    join public.profiles
      on profiles.id = vendors.owner_id
    where vendors.id = target_vendor_id
      and vendors.owner_id = (select auth.uid())
      and profiles.is_active = true
  );
$$;

create or replace function public.can_view_order(
  target_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders
    where orders.id = target_order_id
      and (
        orders.customer_id = (select auth.uid())
        or public.owns_vendor(orders.vendor_id)
        or public.is_admin()
      )
  );
$$;

revoke all
on function public.is_admin()
from public;

revoke all
on function public.owns_vendor(uuid)
from public;

revoke all
on function public.can_view_order(uuid)
from public;

grant execute
on function public.is_admin()
to authenticated;

grant execute
on function public.owns_vendor(uuid)
to authenticated;

grant execute
on function public.can_view_order(uuid)
to authenticated;

-- =========================================================
-- 14. PREVENT ROLE AND STATUS SELF-ESCALATION
-- =========================================================

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.is_admin() then

    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.created_at is distinct from old.created_at then

      raise exception
        'You cannot modify protected profile fields.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_sensitive_fields
  on public.profiles;

create trigger profiles_protect_sensitive_fields
before update on public.profiles
for each row
execute function public.protect_profile_sensitive_fields();

create or replace function public.protect_vendor_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.is_admin() then

    if new.id is distinct from old.id
       or new.owner_id is distinct from old.owner_id
       or new.status is distinct from old.status
       or new.commission_rate is distinct from old.commission_rate
       or new.created_at is distinct from old.created_at then

      raise exception
        'You cannot modify protected vendor fields.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists vendors_protect_sensitive_fields
  on public.vendors;

create trigger vendors_protect_sensitive_fields
before update on public.vendors
for each row
execute function public.protect_vendor_sensitive_fields();

-- =========================================================
-- 15. INDEXES
-- =========================================================

create index if not exists profiles_role_index
  on public.profiles(role);

create index if not exists vendors_owner_id_index
  on public.vendors(owner_id);

create index if not exists vendors_status_index
  on public.vendors(status);

create index if not exists canteens_vendor_id_index
  on public.canteens(vendor_id);

create index if not exists canteens_active_index
  on public.canteens(vendor_id, is_active);

create index if not exists menu_categories_vendor_id_index
  on public.menu_categories(vendor_id);

create index if not exists menu_categories_canteen_id_index
  on public.menu_categories(canteen_id);

create index if not exists menu_categories_display_index
  on public.menu_categories(
    canteen_id,
    is_active,
    display_order
  );

create index if not exists menu_items_vendor_id_index
  on public.menu_items(vendor_id);

create index if not exists menu_items_canteen_id_index
  on public.menu_items(canteen_id);

create index if not exists menu_items_category_id_index
  on public.menu_items(category_id);

create index if not exists menu_items_public_menu_index
  on public.menu_items(
    canteen_id,
    category_id,
    is_available
  );

create index if not exists orders_customer_created_index
  on public.orders(customer_id, created_at desc);

create index if not exists orders_vendor_status_created_index
  on public.orders(vendor_id, status, created_at desc);

create index if not exists orders_canteen_created_index
  on public.orders(canteen_id, created_at desc);

create index if not exists order_items_order_id_index
  on public.order_items(order_id);

create index if not exists order_items_menu_item_id_index
  on public.order_items(menu_item_id);

create index if not exists payments_order_id_index
  on public.payments(order_id);

create unique index if not exists payments_provider_reference_unique
  on public.payments(
    payment_provider,
    transaction_reference
  )
  where transaction_reference is not null;

-- =========================================================
-- 16. ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles
  enable row level security;

alter table public.vendors
  enable row level security;

alter table public.canteens
  enable row level security;

alter table public.menu_categories
  enable row level security;

alter table public.menu_items
  enable row level security;

alter table public.orders
  enable row level security;

alter table public.order_items
  enable row level security;

alter table public.payments
  enable row level security;

-- =========================================================
-- 17. REMOVE OLD POLICIES WHEN SCRIPT IS RE-RUN
-- =========================================================

drop policy if exists profiles_read
  on public.profiles;

drop policy if exists profiles_update
  on public.profiles;

drop policy if exists vendors_public_read
  on public.vendors;

drop policy if exists vendors_private_read
  on public.vendors;

drop policy if exists vendors_insert_owner
  on public.vendors;

drop policy if exists vendors_insert_admin
  on public.vendors;

drop policy if exists vendors_update
  on public.vendors;

drop policy if exists vendors_delete_admin
  on public.vendors;

drop policy if exists canteens_public_read
  on public.canteens;

drop policy if exists canteens_private_read
  on public.canteens;

drop policy if exists canteens_insert
  on public.canteens;

drop policy if exists canteens_update
  on public.canteens;

drop policy if exists canteens_delete
  on public.canteens;

drop policy if exists categories_public_read
  on public.menu_categories;

drop policy if exists categories_private_read
  on public.menu_categories;

drop policy if exists categories_insert
  on public.menu_categories;

drop policy if exists categories_update
  on public.menu_categories;

drop policy if exists categories_delete
  on public.menu_categories;

drop policy if exists items_public_read
  on public.menu_items;

drop policy if exists items_private_read
  on public.menu_items;

drop policy if exists items_insert
  on public.menu_items;

drop policy if exists items_update
  on public.menu_items;

drop policy if exists items_delete
  on public.menu_items;

drop policy if exists orders_read
  on public.orders;

drop policy if exists order_items_read
  on public.order_items;

drop policy if exists payments_read
  on public.payments;

-- =========================================================
-- 18. PROFILE POLICIES
-- =========================================================

create policy profiles_read
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
);

create policy profiles_update
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
)
with check (
  id = (select auth.uid())
  or public.is_admin()
);

-- =========================================================
-- 19. VENDOR POLICIES
-- =========================================================

create policy vendors_public_read
on public.vendors
for select
to anon, authenticated
using (
  status = 'approved'
);

create policy vendors_private_read
on public.vendors
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or public.is_admin()
);

create policy vendors_insert_owner
on public.vendors
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'pending'
  and commission_rate = 0
);

create policy vendors_insert_admin
on public.vendors
for insert
to authenticated
with check (
  public.is_admin()
);

create policy vendors_update
on public.vendors
for update
to authenticated
using (
  public.owns_vendor(id)
  or public.is_admin()
)
with check (
  public.owns_vendor(id)
  or public.is_admin()
);

create policy vendors_delete_admin
on public.vendors
for delete
to authenticated
using (
  public.is_admin()
);

-- =========================================================
-- 20. CANTEEN POLICIES
-- =========================================================

create policy canteens_public_read
on public.canteens
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.vendors
    where vendors.id = canteens.vendor_id
      and vendors.status = 'approved'
  )
);

create policy canteens_private_read
on public.canteens
for select
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy canteens_insert
on public.canteens
for insert
to authenticated
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy canteens_update
on public.canteens
for update
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
)
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy canteens_delete
on public.canteens
for delete
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

-- =========================================================
-- 21. MENU CATEGORY POLICIES
-- =========================================================

create policy categories_public_read
on public.menu_categories
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.canteens
    join public.vendors
      on vendors.id = canteens.vendor_id
    where canteens.id = menu_categories.canteen_id
      and canteens.is_active = true
      and vendors.status = 'approved'
  )
);

create policy categories_private_read
on public.menu_categories
for select
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy categories_insert
on public.menu_categories
for insert
to authenticated
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy categories_update
on public.menu_categories
for update
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
)
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy categories_delete
on public.menu_categories
for delete
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

-- =========================================================
-- 22. MENU ITEM POLICIES
-- =========================================================

create policy items_public_read
on public.menu_items
for select
to anon, authenticated
using (
  is_available = true

  and (
    track_stock = false
    or stock_quantity > 0
  )

  and exists (
    select 1
    from public.menu_categories
    join public.canteens
      on canteens.id = menu_categories.canteen_id
    join public.vendors
      on vendors.id = canteens.vendor_id
    where menu_categories.id = menu_items.category_id
      and menu_categories.is_active = true
      and canteens.is_active = true
      and vendors.status = 'approved'
  )
);

create policy items_private_read
on public.menu_items
for select
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy items_insert
on public.menu_items
for insert
to authenticated
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy items_update
on public.menu_items
for update
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
)
with check (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy items_delete
on public.menu_items
for delete
to authenticated
using (
  public.owns_vendor(vendor_id)
  or public.is_admin()
);

-- =========================================================
-- 23. ORDER AND PAYMENT READ POLICIES
-- Direct writes will be added through secure RPC functions later
-- =========================================================

create policy orders_read
on public.orders
for select
to authenticated
using (
  customer_id = (select auth.uid())
  or public.owns_vendor(vendor_id)
  or public.is_admin()
);

create policy order_items_read
on public.order_items
for select
to authenticated
using (
  public.can_view_order(order_id)
);

create policy payments_read
on public.payments
for select
to authenticated
using (
  public.can_view_order(order_id)
);

-- =========================================================
-- 24. TABLE PERMISSIONS
-- =========================================================

grant usage on schema public
to anon, authenticated;

revoke all on table public.profiles
from anon, authenticated;

revoke all on table public.vendors
from anon, authenticated;

revoke all on table public.canteens
from anon, authenticated;

revoke all on table public.menu_categories
from anon, authenticated;

revoke all on table public.menu_items
from anon, authenticated;

revoke all on table public.orders
from anon, authenticated;

revoke all on table public.order_items
from anon, authenticated;

revoke all on table public.payments
from anon, authenticated;

-- Logged-out users can view approved public menus.

grant select
on table public.vendors
to anon;

grant select
on table public.canteens
to anon;

grant select
on table public.menu_categories
to anon;

grant select
on table public.menu_items
to anon;

-- Logged-in user permissions.

grant select, update
on table public.profiles
to authenticated;

grant select, insert, update, delete
on table public.vendors
to authenticated;

grant select, insert, update, delete
on table public.canteens
to authenticated;

grant select, insert, update, delete
on table public.menu_categories
to authenticated;

grant select, insert, update, delete
on table public.menu_items
to authenticated;

-- Orders are read-only through the normal table API for now.
-- Later, secure database functions will create and update orders.

grant select
on table public.orders
to authenticated;

grant select
on table public.order_items
to authenticated;

grant select
on table public.payments
to authenticated;

commit;