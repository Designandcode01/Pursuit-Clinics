# Wellnest appointment booking

A doctor appointment booking platform built with Next.js App Router, TypeScript, Tailwind CSS v4, Clerk, Drizzle ORM, and Neon PostgreSQL.

## Requirements

- Node.js 20.9 or newer (required by Next.js 16)
- npm
- A Neon PostgreSQL database
- A Clerk application

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Neon pooled connection string, plus the Clerk keys from your Clerk application.
3. Apply the checked-in schema with `npm run db:migrate`.
4. Start the app with `npm run dev`.

The current database schema is in `src/db/schema.ts`. Migration generation is local; applying migrations requires a reachable database. Never commit `.env.local` or real credentials.

## Neon setup

Create a PostgreSQL project in Neon and use its pooled connection string for the serverless app. Keep the connection string private. The database module is server-only and reads `DATABASE_URL` at runtime.
`APP_CURRENCY` controls minor-unit fee display and defaults to `PKR`.

## Clerk setup

Create a Clerk application and configure its sign-in and sign-up routes to use `/sign-in` and `/sign-up`. Add the publishable and secret keys to `.env.local`. The app synchronizes Clerk identities on the first authenticated onboarding request and refreshes name/email/image on later requests. It uses Clerk's immutable user ID as the identity key and never updates the database role from Clerk profile data or browser input. New identities receive only the database default `PATIENT` role. A webhook secret is not needed for this request-time synchronization approach.

### First administrator bootstrap

After the intended Clerk account has signed in once (so its database row exists), use the Neon SQL console as a trusted operator. Replace the placeholder with that account's Clerk user ID, review the affected row, and commit only if it is the intended account:

```sql
BEGIN;
UPDATE users
SET role = 'ADMIN', updated_at = now()
WHERE clerk_user_id = 'user_replace_with_verified_clerk_id'
  AND role = 'PATIENT';
-- Confirm exactly one expected account was updated before committing.
SELECT clerk_user_id, email, role FROM users
WHERE clerk_user_id = 'user_replace_with_verified_clerk_id';
COMMIT;
```

Never expose a role-selection control to users. All protected operations must check the role loaded from this table.

## Scheduling data rules

- Appointment instants use PostgreSQL `timestamptz`.
- Weekly availability uses ISO weekdays (Monday = 1) and local `time` values interpreted in the IANA timezone stored on the doctor's profile.
- Fees are integer minor currency units. The display currency must be selected for the deployment before showing fees.
- New bookings are created as `PENDING` and hold the slot until the doctor confirms/rejects it or the patient/doctor cancels it. There is no automatic pending timeout; doctors should review pending requests promptly. Patients can cancel at least 24 hours before the appointment. Rejected and cancelled appointments release the slot; completed appointments do not.
- Doctor-local ambiguous fall-back times use the earlier matching instant; nonexistent spring-forward times are skipped. Slots are generated within one doctor's local calendar day, use the doctor's timezone, and are limited to the next 90 local dates.

## Security and operations

Every protected page, Server Action, and Route Handler performs database-backed authorization and validates untrusted input. Patient reads are scoped to their user ID, and doctor appointment/time-off queries are scoped to the owned doctor profile. A PostgreSQL exclusion constraint rejects overlapping pending or confirmed appointments even when concurrent requests both saw a slot as available.

The public doctor directory and availability endpoint use a shared, Neon-backed fixed-window rate limiter (60 directory requests and 120 availability requests per client IP per minute). Keys are HMAC-hashed with the database connection string; stale buckets are opportunistically removed after seven days. Apply the rate-limit table migration before deploying this version. Monitor database load and public request volume; a dedicated edge/Redis limiter can replace this implementation if traffic grows. Do not collect detailed medical records in appointment reason fields.

For a visual preview before adding providers, set `USE_DEMO_DATA=true` in a development `.env.local` and restart the dev server. Fictional directory entries appear only when the database has no active doctors. Their booking route, patient dashboard, and doctor workspace are clearly labeled UI simulations: they do not create appointments or transmit patient data. Confirm and reject controls only change the doctor workspace's local sample state; the patient preview can also simulate cancellation. The flag is ignored outside development and no mock Clerk users or database rows are created.

## Development seed data

`npm run db:seed` safely inserts sample specialties after `ALLOW_DEVELOPMENT_SEED=true` is explicitly set in a development `.env.local`. To seed provider profiles, create real Clerk test accounts, sign in and complete onboarding, then set their Clerk IDs in `DEMO_DOCTOR_CLERK_USER_IDS` as a comma-separated list. The script links those accounts, assigns doctor role, and inserts weekday availability; it refuses to run with `NODE_ENV=production`. It does not create fake Clerk identities.

## Deployment

Set `DATABASE_URL` and the Clerk environment variables in Vercel project settings. Apply migrations against the production database with `npm run db:migrate` as a controlled deployment step. Configure Clerk's production domain and sign-in/sign-up redirect URLs in the dashboard.

## Scripts

- `npm run dev` — local development server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — automated appointment-policy and timezone tests
- `npm run db:generate` — generate Drizzle migrations from the schema
- `npm run db:migrate` — apply pending migrations to `DATABASE_URL`
- `npm run db:studio` — open Drizzle Studio
- `npm run db:seed` — add repeatable development specialties and explicitly configured real test providers

## Current phase

The application includes the dark public directory, Clerk sign-in/onboarding and database-backed roles, doctor profiles and availability, conflict-safe pending bookings, patient and doctor dashboards, administrator management pages, and shared rate limiting for public reads. The initial Drizzle migration has been applied to the configured Neon database. Run `npm run lint`, `npm run typecheck`, and `npm test` before deployment. Production still needs its own environment configuration and final manual verification; see Security and operations.

## Manual smoke checklist

1. Create/sign in with a Clerk patient; verify onboarding creates a `PATIENT` row and the patient cannot open doctor/admin routes.
2. As an administrator, bootstrap via the documented SQL procedure, add a specialty, and assign a real Clerk account as a doctor.
3. As a doctor, add weekly local-time availability, edit profile/timezone, and add future time off; confirm conflicting booked appointments block time-off creation.
4. As a patient, discover an active doctor, book a future slot, and confirm the detail page and dashboard show the `PENDING` appointment in the doctor's timezone.
5. Attempt the same slot in two sessions; exactly one booking should be accepted. Confirm pending and confirmed bookings remove availability.
6. Verify patient cancellation is blocked within 24 hours and permitted outside the cutoff; verify doctor actions follow the lifecycle rules.
7. Attempt URL and form tampering with another patient's appointment ID and another doctor's record; requests must fail without exposing details.
8. Check mobile navigation, empty/loading/error states, keyboard focus, and dark colors at narrow and wide viewports.
