# Specialist authentication: verification before release

## What is fixed locally
- Linux build: correct case-sensitive prayer component import.
- Preserve Supabase error codes, including unconfirmed email.
- Missing/unsupported profile role goes to an explicit recovery screen.
- Profile request failures are distinguished from signed-out sessions.
- Ignore obsolete profile responses after an auth state change/unmount.
- Specialist data query errors are visible and retryable, not empty-state data.

## Still unverified
The original defense-time incident has not been reproduced with a test account.
The signup trigger and RLS policies are not included in this repository. The
recovery screen does not provision profiles or grant roles. Do not treat this
change as a completed profile-onboarding feature or production certification.

## Read-only Supabase checks (project owner)
Use the project's dashboard and a dedicated test account. Do not share passwords,
service-role keys, access tokens, or child records.

1. Auth > Users: confirm the test account exists and whether email is confirmed.
2. Inspect its own profiles row: id must match auth user id; role must be specialist.
3. Inspect its specialists row: this frontend currently queries specialists.id by
   auth user id. Verify the actual foreign key/schema before changing this assumption.
4. Inspect the auth.users INSERT trigger, its function and Auth logs for errors.
   authService.js references trigger_update.sql, which is absent in this checkout.
5. Inspect RLS for profiles, specialists, specialist_children, sessions and reports.
   Dashboard/admin visibility does not prove an authenticated user can read a row.
6. Verify the configured Auth Site URL and allowed redirects for the actual Vercel URL.

## Acceptance journeys
- Unconfirmed email produces explicit Arabic confirmation instructions.
- Existing specialist signs in and reaches /tawasl; refresh preserves access.
- New specialist registration creates the correct profile and specialist record.
- Missing profile shows recovery; retry succeeds after backend provisioning repair.
- Network/read-policy failure shows an error, not an empty caseload.
- Parent can access /parent and /kids, not specialist data; specialist cannot access
  parent data. Validate these restrictions through authenticated database requests,
  not only route redirects.
- Sign out during a pending profile request never restores a prior user's profile.
- Wrong password and unavailable session do not expose protected dashboards.

## Checks run locally
`npm run build`, `node --test tests/authPolicy.test.mjs`, and `npm run lint` pass.
The lint configuration covers JS/JSX, not TSX; no TypeScript check is configured.
No real account was created and no production database data was modified.
