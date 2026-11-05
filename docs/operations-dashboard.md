# Operations dashboard — first increment

The `/operations` route provides a responsive Arabic, read-only aggregate dashboard. It loads real counts through `operations_overview`, never directly queries clinical records, and distinguishes unauthenticated, denied, backend-not-installed, loading, invalid-response and network-error states. It does not fabricate zero values when fetching fails. Refresh is explicit; this is not a live subscription.

## Activation status

The migration was applied manually through the hosted SQL Editor on 2026-10-25 after checking live column definitions. No migration-history entry was added. The owner-approved existing account has now been granted read-only operations membership. Profile roles and signup metadata do not confer operations access.

## Deployment procedure

1. Review the live schema against the referenced tables/columns and test the migration in a staging project first. Back up configuration and inspect existing grants before production deployment.
2. Apply `supabase/migrations/202610250001_operations_overview.sql` using a trusted database operator. Membership has RLS enabled, no client policies and no client table grants. The RPC uses a fixed empty search path and fully qualified relations.
3. Identify an existing authorized staff user by verified auth UUID. A trusted database operator can insert that UUID and the granting operator UUID into `public.operations_members`. Do not use signup metadata or put a service key in the frontend.
4. Verify anon cannot execute the RPC; authenticated parent and specialist without membership get `42501`; attempts to read or insert membership from the browser fail; a designated staff member receives aggregate counts only. Revoke membership and verify subsequent RPC requests fail. Previously displayed aggregate values are not remotely erased.
5. Compare counts with controlled fixtures. Test loading, failure, refresh, narrow/mobile layout and account switching in the browser. See the dated verification records below for completed checks and remaining gaps.

## Boundaries

This does not grant clinical-record access, approve specialists, manage appointments, issue refunds, assign staff or provide audit logging. No blanket admin policy was added to child or report tables. Add each privileged operation with its own authorization, audit and acceptance tests. Count queries span current records across all dates; specialist account count is not credential verification. Session status is not proof of attendance. Optimize query/index costs against actual production volumes before scaling.

Unit tests cover RPC response handling only; they do not prove database permissions.

## Hosted verification — 2026-10-25
- Live columns for profiles, specialists, children and sessions matched the aggregate query.
- Migration execution returned success.
- Catalog checks: RLS enabled; membership count zero; authenticated SELECT/INSERT on membership denied; anon EXECUTE on overview denied.
- Calling the function as authenticated without JWT identity returned SQLSTATE 42501 (Operations access required). This checks the no-identity guard, not a complete signed-in cross-account test.
- SQL role/JWT-context simulation now passes for the approved member and rejects the nonmember QA parent with 42501. Real browser authentication and revoked-member tests remain pending. No clinical records changed. No staging project was available; staging validation was not performed.

## Activation follow-up
Owner-approved membership was inserted successfully. In a rollback-only SQL transaction, the authenticated role with the member identity returned aggregate counts; the QA parent identity was denied. No credentials or clinical records were used in test artifacts. The login link preserves /operations as its return path, with an allowlisted redirect policy. Validation: 55 unit tests, JS/JSX lint and build pass.

## Account identity and logout — 2026-10-26

The operations page now verifies the current account with Supabase Auth `getUser`, displays only email and an expandable user ID, and provides local-device logout. Identity mismatches and verification errors do not display a verified identity. No session credentials are exposed by this UI. Logout errors remain visible; successful logout reloads the signed-out operations route to discard rendered state. Database membership and profile roles were not modified.

Validation: 59 unit tests, configured JS/JSX lint, production build and diff check passed. Four new service tests cover identity projection, account mismatch, auth/network failures and local-device logout. They do not replace interaction or RLS tests. The code and tests were uploaded to the review branch through the authenticated GitHub UI and fetched back with identical file contents.

Browser verification confirmed that a synthetic nonmember was denied operations access and could log out successfully. The signed-out screen no longer displayed account details. A second nonmember sign-in was also denied. Account identifiers and credentials are intentionally excluded from this public record. The owner account has NOT yet been verified in the application; real aggregate counts, authorized refresh/reload and clearing previously displayed owner counts after account switching remain pending. No permission expansion was used to address denial.
