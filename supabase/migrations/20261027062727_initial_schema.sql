-- Application foundation. No browser-visible table can self-assign an owner role.
create extension if not exists pgcrypto;

create type public.practice_role as enum (
  'owner', 'professional', 'office_staff', 'accounts', 'reviewer'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.protect_profile_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id then
    raise exception 'Profile identity cannot be changed';
  end if;
  return new;
end;
$$;
create trigger profiles_identity_protected before update on public.profiles
  for each row execute function public.protect_profile_identity();

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.practice_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permission_scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource text not null check (resource ~ '^[a-z][a-z_]{1,62}$'),
  action text not null check (action in ('read', 'create', 'update', 'delete', 'read_sensitive')),
  assignment_id uuid,
  fields text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, resource, action, assignment_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  reference_code text not null unique check (char_length(reference_code) <= 80),
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assignments_created_by_idx on public.assignments(created_by);

create table public.assignment_members (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  can_read boolean not null default true,
  can_write boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (assignment_id, user_id),
  check (not can_write or can_read)
);

create index assignment_members_user_idx on public.assignment_members(user_id, assignment_id);
alter table public.permission_scopes add constraint permission_scopes_assignment_fk
  foreign key (assignment_id) references public.assignments(id) on delete cascade;

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  resource text not null check (char_length(resource) between 1 and 100),
  resource_id text check (char_length(resource_id) <= 200),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_events_actor_created_idx on public.audit_events(actor_id, created_at desc);
create index audit_events_resource_created_idx on public.audit_events(resource, created_at desc);

create or replace function public.current_role()
returns public.practice_role
language sql stable security definer
set search_path = ''
as $$
  select ur.role from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.active
$$;

create or replace function public.has_scope(
  p_resource text, p_action text, p_assignment_id uuid default null
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.permission_scopes ps
    where ps.user_id = (select auth.uid())
      and ps.resource = p_resource and ps.action = p_action
      and (ps.assignment_id is null or ps.assignment_id = p_assignment_id)
  )
$$;

create or replace function public.is_assignment_member(
  p_assignment_id uuid, p_writable boolean default false
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignment_members am
    where am.assignment_id = p_assignment_id and am.user_id = (select auth.uid())
      and am.can_read and (not p_writable or am.can_write)
  )
$$;

create or replace function public.bootstrap_first_owner(p_user_id uuid, p_display_name text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    raise exception 'Bootstrap must be called from a trusted database session';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'The Auth user must be provisioned first';
  end if;
  if exists (select 1 from public.user_roles where role = 'owner' and active) then
    raise exception 'An active owner already exists';
  end if;
  insert into public.profiles(id, display_name)
    values (p_user_id, coalesce(nullif(trim(p_display_name), ''), 'Practice owner'))
    on conflict (id) do update set display_name = excluded.display_name, updated_at = now();
  insert into public.user_roles(user_id, role, active)
    values (p_user_id, 'owner', true)
    on conflict (user_id) do update set role = 'owner', active = true, updated_at = now();
end;
$$;

revoke all on function public.bootstrap_first_owner(uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_first_owner(uuid, text) to service_role;

create or replace function public.protect_role_assignments()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Role assignments require trusted administrative provisioning';
end;
$$;

create trigger user_roles_protected before insert or update or delete on public.user_roles
  for each row execute function public.protect_role_assignments();

create or replace function public.handle_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
    on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_auth_user_created();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.permission_scopes enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_members enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_self_or_owner on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_role()) = 'owner');
create policy profiles_update_self_safe on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy user_roles_select_self_or_owner on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'owner');
-- No authenticated write policy exists for user_roles by design.

create policy permission_scopes_select_self_or_owner on public.permission_scopes for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'owner');
-- Scope writes are performed only by trusted provisioning tooling.

create policy assignments_select_authorized on public.assignments for select to authenticated
  using (
    (select public.current_role()) = 'owner'
    or (select public.is_assignment_member(id, false))
    or (select public.has_scope('assignments', 'read', id))
  );
create policy assignments_insert_authorized on public.assignments for insert to authenticated
  with check (
    created_by = (select auth.uid()) and (
      (select public.current_role()) = 'owner'
      or (select public.has_scope('assignments', 'create', null))
    )
  );
create policy assignments_update_authorized on public.assignments for update to authenticated
  using (
    (select public.current_role()) = 'owner'
    or (select public.is_assignment_member(id, true))
    or (select public.has_scope('assignments', 'update', id))
  ) with check (
    (select public.current_role()) = 'owner'
    or (select public.is_assignment_member(id, true))
    or (select public.has_scope('assignments', 'update', id))
  );
create policy assignments_delete_owner on public.assignments for delete to authenticated
  using ((select public.current_role()) = 'owner');

create policy assignment_members_select_authorized on public.assignment_members for select to authenticated
  using (
    user_id = (select auth.uid()) or (select public.current_role()) = 'owner'
    or (select public.is_assignment_member(assignment_id, false))
  );
create policy assignment_members_write_owner on public.assignment_members for all to authenticated
  using ((select public.current_role()) = 'owner')
  with check ((select public.current_role()) = 'owner');

create policy audit_events_select_owner on public.audit_events for select to authenticated
  using ((select public.current_role()) = 'owner');
-- Audit event insertion is intentionally reserved for trusted server/database code.

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles, public.permission_scopes to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, update, delete on public.assignment_members to authenticated;
grant select on public.audit_events to authenticated;

-- The private bucket stores `<assignment UUID>/<opaque filename>` object keys.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('assignment-documents', 'assignment-documents', false, 52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false;

create policy assignment_docs_read on storage.objects for select to authenticated
  using (
    bucket_id = 'assignment-documents'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      (select public.current_role()) = 'owner'
      or (select public.is_assignment_member(((storage.foldername(name))[1])::uuid, false))
      or (select public.has_scope('documents', 'read', ((storage.foldername(name))[1])::uuid))
    )
  );
create policy assignment_docs_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assignment-documents' and owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      (select public.current_role()) = 'owner'
      or (select public.is_assignment_member(((storage.foldername(name))[1])::uuid, true))
      or (select public.has_scope('documents', 'create', ((storage.foldername(name))[1])::uuid))
    )
  );
create policy assignment_docs_update on storage.objects for update to authenticated
  using (
    bucket_id = 'assignment-documents' and (
      (select public.current_role()) = 'owner'
      or (select public.is_assignment_member(((storage.foldername(name))[1])::uuid, true))
      or (select public.has_scope('documents', 'update', ((storage.foldername(name))[1])::uuid))
    )
  ) with check (bucket_id = 'assignment-documents');
create policy assignment_docs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'assignment-documents' and (
      (select public.current_role()) = 'owner'
      or (select public.has_scope('documents', 'delete', ((storage.foldername(name))[1])::uuid))
    )
  );
