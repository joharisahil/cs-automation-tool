# AK & Associates Practice Workspace

A secure Next.js foundation for CS practice workflow management. The current app includes Supabase email/password authentication, protected routes, a responsive dashboard shell, and an initial PostgreSQL authorization model. Assignment, client, task, document and billing screens are explicitly placeholders; they do not yet implement those workflows.

## Stack and layout

- Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui components
- Supabase PostgreSQL, Auth, and private Storage through `@supabase/ssr`
- React Hook Form and Zod are installed for typed forms; current auth actions use server action validation with Zod
- `app/`: auth pages, protected dashboard, loading and error UI
- `components/`: reusable auth and shadcn UI
- `lib/supabase/`: browser/server clients and Next.js session refresh
- `lib/validations/`, `lib/auth/`, `lib/env.ts`, `lib/logger.ts`: validation, roles, config and safe structured logs
- `supabase/migrations/`: database schema and policies; `supabase/tests/`: pgTAP authorization assertions

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL` for your Supabase project.
3. In Supabase, enable email/password sign-in and configure the site URL and allowed redirect URL `http://localhost:3000/reset-password` (plus your production URL).
4. Apply migrations with the Supabase CLI: `supabase db push`. For local development, start a local stack with `supabase start`, then run `supabase db reset`.
5. Start the app with `npm run dev`.

The publishable key is intended for browser use. Never configure a service-role key as a `NEXT_PUBLIC_*` variable. Server-side data access uses the caller's cookie-backed user token, so RLS applies.

## First owner provisioning

Public sign-up is not implemented. Create the initial account from the Supabase Dashboard Auth user interface, send a password setup/invitation email, then use the trusted SQL editor or a protected operator script to invoke the one-time bootstrap with that existing Auth user's UUID:

```sql
select public.bootstrap_first_owner('AUTH_USER_UUID', 'Practice Owner Name');
```

The function is executable only by `service_role` and rejects calls while an authenticated user context exists. Never expose a service-role key in the app. After the initial owner is active, create each team member through the Supabase Auth admin workflow and assign roles/scopes using trusted database tooling. No public or authenticated RLS policy can write `user_roles` or `permission_scopes`. Review and log operator provisioning activity according to your deployment controls.

## Authorization model

The roles are `owner`, `professional`, `office_staff`, `accounts`, and `reviewer`. The owner can administer assignments and member records. Non-owner assignment reads and writes require explicit membership or a resource/action permission scope. `permission_scopes.fields` is groundwork for field-level service filtering; PostgreSQL column grants/views must be added for future sensitive fields. RLS cannot hide individual columns in a broad `SELECT *` table query, so modules that add such data must use explicit column grants or role-filtered views before exposing it.

Every public table has RLS enabled. Profiles are self-readable/updatable; roles and scopes are readable only by self/owner and writes are withheld from authenticated users. Audit events are owner-readable and reserved for trusted database/server writers. Storage bucket `assignment-documents` is private; object names must start with an assignment UUID. Storage policies require owner, membership, or a matching scope. Use signed URLs only after authorization and keep them short-lived.

## Tests and commands

- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript validation
- `npm run build` — production build
- `supabase test db` — pgTAP RLS assertions in `supabase/tests/rls.sql` (requires Supabase CLI and a running local database)

The SQL test uses synthetic addresses and IDs only. There are no client records or mock authentication/data responses in the app.

## Operational notes

Use HTTPS in production, enable MFA for owner accounts, enforce SMTP delivery and recovery URL allowlists, and monitor Supabase Auth and database logs. Application logs contain only event names and safe error codes, never credentials, tokens or client content. The current dashboard displays empty states and placeholders until domain modules and their additional RLS tests are implemented.
