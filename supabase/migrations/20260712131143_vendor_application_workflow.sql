begin;

-- =========================================================
-- 1. VENDOR REVIEW FIELDS
-- =========================================================

alter table public.vendors
  add column if not exists review_notes text;

alter table public.vendors
  add column if not exists reviewed_at timestamptz;

alter table public.vendors
  add column if not exists reviewed_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_reviewed_by_fkey'
      and conrelid = 'public.vendors'::regclass
  ) then
    alter table public.vendors
      add constraint vendors_reviewed_by_fkey
      foreign key (reviewed_by)
      references public.profiles(id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_review_notes_length'
      and conrelid = 'public.vendors'::regclass
  ) then
    alter table public.vendors
      add constraint vendors_review_notes_length
      check (
        review_notes is null
        or char_length(review_notes) <= 1000
      );
  end if;
end
$$;

-- One vendor business per owner for the MVP.

create unique index if not exists vendors_owner_unique_index
  on public.vendors(owner_id);

create index if not exists vendors_reviewed_by_index
  on public.vendors(reviewed_by);

-- =========================================================
-- 2. PROTECT VENDOR REVIEW FIELDS
-- Owners may resubmit rejected applications.
-- Only admins may otherwise change review fields or status.
-- =========================================================

create or replace function public.protect_vendor_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_owner_resubmission boolean;
begin
  if (select auth.uid()) is not null
     and not public.is_admin() then

    is_owner_resubmission :=
      old.owner_id = (select auth.uid())
      and old.status = 'rejected'
      and new.status = 'pending'
      and new.review_notes is null
      and new.reviewed_at is null
      and new.reviewed_by is null;

    if new.id is distinct from old.id
       or new.owner_id is distinct from old.owner_id
       or new.commission_rate is distinct from old.commission_rate
       or new.created_at is distinct from old.created_at then

      raise exception
        'You cannot modify protected vendor fields.';
    end if;

    if (
      new.status is distinct from old.status
      or new.review_notes is distinct from old.review_notes
      or new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by
    )
    and not is_owner_resubmission then

      raise exception
        'You cannot modify vendor review fields.';
    end if;
  end if;

  return new;
end;
$$;

-- The trigger already exists from Phase 3.
-- Recreate it to ensure it uses the new function.

drop trigger if exists vendors_protect_sensitive_fields
  on public.vendors;

create trigger vendors_protect_sensitive_fields
before update on public.vendors
for each row
execute function public.protect_vendor_sensitive_fields();

-- =========================================================
-- 3. SUBMIT OR RESUBMIT VENDOR APPLICATION
-- =========================================================

create or replace function public.submit_vendor_application(
  p_business_name text,
  p_slug text,
  p_description text,
  p_phone text,
  p_email text,
  p_address text,
  p_currency_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_app_role public.app_role;
  v_account_is_active boolean;

  v_existing_vendor public.vendors;
  v_vendor_id uuid;

  v_business_name text;
  v_slug text;
  v_email text;
  v_currency text;
begin
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
    raise exception
      'Application profile was not found for user %.',
      v_user_id;
  end if;

  if v_account_is_active is not true then
    raise exception 'This account is disabled.';
  end if;

  if v_app_role is distinct from
     'customer'::public.app_role then
    raise exception
      'Only customer accounts can submit vendor applications. Current role: %.',
      coalesce(v_app_role::text, 'missing');
  end if;

  v_business_name :=
    btrim(coalesce(p_business_name, ''));

  v_slug :=
    lower(btrim(coalesce(p_slug, '')));

  v_email :=
    lower(btrim(coalesce(p_email, '')));

  v_currency :=
    upper(btrim(coalesce(p_currency_code, '')));

  if char_length(v_business_name) < 2
     or char_length(v_business_name) > 150 then
    raise exception
      'Business name must contain between 2 and 150 characters.';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception
      'The vendor slug contains invalid characters.';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception
      'Currency must use a three-letter code.';
  end if;

  if char_length(v_email) = 0 then
    raise exception
      'A business email address is required.';
  end if;

  select vendor.*
  into v_existing_vendor
  from public.vendors as vendor
  where vendor.owner_id = v_user_id
  for update;

  if found then
    if v_existing_vendor.status = 'pending' then
      raise exception
        'You already have a pending vendor application.';
    end if;

    if v_existing_vendor.status = 'approved' then
      raise exception
        'Your vendor application is already approved.';
    end if;

    if v_existing_vendor.status = 'suspended' then
      raise exception
        'Your vendor account is currently suspended.';
    end if;

    if v_existing_vendor.status = 'rejected' then
      update public.vendors
      set
        business_name = v_business_name,
        slug = v_slug,

        description = nullif(
          btrim(coalesce(p_description, '')),
          ''
        ),

        phone = nullif(
          btrim(coalesce(p_phone, '')),
          ''
        ),

        email = v_email,

        address = nullif(
          btrim(coalesce(p_address, '')),
          ''
        ),

        currency_code = v_currency,
        status = 'pending',
        review_notes = null,
        reviewed_at = null,
        reviewed_by = null
      where id = v_existing_vendor.id
      returning id into v_vendor_id;

      return v_vendor_id;
    end if;
  end if;

  insert into public.vendors (
    owner_id,
    business_name,
    slug,
    description,
    phone,
    email,
    address,
    currency_code,
    status,
    commission_rate
  )
  values (
    v_user_id,
    v_business_name,
    v_slug,

    nullif(
      btrim(coalesce(p_description, '')),
      ''
    ),

    nullif(
      btrim(coalesce(p_phone, '')),
      ''
    ),

    v_email,

    nullif(
      btrim(coalesce(p_address, '')),
      ''
    ),

    v_currency,
    'pending',
    0
  )
  returning id into v_vendor_id;

  return v_vendor_id;
end;
$$;

-- =========================================================
-- 4. ADMIN REVIEW FUNCTION
-- Approves/rejects vendor and changes profile role atomically.
-- =========================================================

create or replace function public.review_vendor_application(
  p_vendor_id uuid,
  p_decision text,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  vendor_record public.vendors;
  cleaned_decision text;
  cleaned_notes text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  cleaned_decision := lower(btrim(coalesce(p_decision, '')));
  cleaned_notes := nullif(btrim(coalesce(p_review_notes, '')), '');

  if cleaned_decision not in ('approved', 'rejected') then
    raise exception
      'Decision must be approved or rejected.';
  end if;

  if cleaned_notes is not null
     and char_length(cleaned_notes) > 1000 then
    raise exception
      'Review notes must not exceed 1000 characters.';
  end if;

  select *
  into vendor_record
  from public.vendors
  where id = p_vendor_id
  for update;

  if not found then
    raise exception 'Vendor application was not found.';
  end if;

  if vendor_record.status <> 'pending' then
    raise exception
      'Only pending applications can be reviewed.';
  end if;

  if cleaned_decision = 'approved'
     and not exists (
       select 1
       from public.profiles
       where id = vendor_record.owner_id
         and is_active = true
     ) then

    raise exception
      'The applicant account is not active.';
  end if;

  update public.vendors
  set
    status = cleaned_decision::public.vendor_status,
    review_notes = cleaned_notes,
    reviewed_at = now(),
    reviewed_by = (select auth.uid())
  where id = p_vendor_id;

  update public.profiles
  set role =
    case
      when cleaned_decision = 'approved'
        then 'vendor'::public.app_role
      else 'customer'::public.app_role
    end
  where id = vendor_record.owner_id;

  return;
end;
$$;

-- =========================================================
-- 5. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.submit_vendor_application(
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
from public;

revoke all
on function public.submit_vendor_application(
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
from anon;

grant execute
on function public.submit_vendor_application(
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
to authenticated;

revoke all
on function public.review_vendor_application(
  uuid,
  text,
  text
)
from public;

revoke all
on function public.review_vendor_application(
  uuid,
  text,
  text
)
from anon;

grant execute
on function public.review_vendor_application(
  uuid,
  text,
  text
)
to authenticated;

commit;