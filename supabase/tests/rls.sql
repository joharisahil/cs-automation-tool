-- Run with: supabase test db. All records use synthetic IDs and roll back.
begin;

select plan(10);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@example.test', '', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'staff@example.test', '', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'other@example.test', '', now(), now(), now());

select is((select public.bootstrap_first_owner('10000000-0000-4000-8000-000000000001', 'Synthetic owner')), null::void, 'trusted bootstrap provisions the first owner');

insert into public.user_roles(user_id, role) values
  ('10000000-0000-4000-8000-000000000002', 'office_staff'),
  ('10000000-0000-4000-8000-000000000003', 'office_staff');

insert into public.assignments(id, title, reference_code, created_by) values
  ('20000000-0000-4000-8000-000000000001', 'Synthetic member assignment', 'TEST-A', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Synthetic private assignment', 'TEST-B', '10000000-0000-4000-8000-000000000001');
insert into public.assignment_members(assignment_id, user_id, can_read, can_write) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', true, true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is((select count(*)::int from public.assignments), 1, 'staff reads only assigned work');
select is((select count(*)::int from public.assignments where id = '20000000-0000-4000-8000-000000000001'), 1, 'staff reads assigned assignment');
select is((select count(*)::int from public.assignments where id = '20000000-0000-4000-8000-000000000002'), 0, 'staff cannot read unassigned assignment');
select throws_ok(
  $$ insert into public.user_roles(user_id, role) values ('10000000-0000-4000-8000-000000000002', 'owner') $$,
  'P0001', 'Role assignments require trusted administrative provisioning', 'staff cannot elevate role'
);
select throws_ok(
  $$ insert into public.permission_scopes(user_id, resource, action) values ('10000000-0000-4000-8000-000000000002', 'assignments', 'read') $$,
  '42501', null, 'staff cannot grant self a scope'
);
select is((select count(*)::int from storage.objects where bucket_id = 'assignment-documents'), 0, 'private bucket has no public listing access');
select throws_ok(
  $$ update public.profiles set id = '10000000-0000-4000-8000-000000000003' where id = '10000000-0000-4000-8000-000000000002' $$,
  'P0001', 'Profile identity cannot be changed', 'staff cannot change own identity'
);
select is((select public.is_assignment_member('20000000-0000-4000-8000-000000000001', true)), true, 'member has assigned write permission');
select is((select public.is_assignment_member('20000000-0000-4000-8000-000000000002', false)), false, 'cross-assignment membership is denied');

select * from finish();
rollback;
