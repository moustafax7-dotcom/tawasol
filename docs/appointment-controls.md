# Appointment controls — 2026-10-27

## Implemented
- Family appointment filters: status, inclusive start/end dates, newest/oldest order, explicit apply and reset. Applying filters returns to page one; current filter values participate in request identity so old responses are hidden.
- Supabase queries apply filters before 20-row pagination, retain child ownership checks, and do not select clinical notes. Invalid dates, reversed ranges, unknown statuses and unsupported sort values are rejected before querying.
- Specialist cancellation asks for confirmation with the child and time shown. Starting, completing and cancelling display pending/error states. A synchronous component guard and hook-level per-session guard suppress duplicate in-flight transitions.
- Existing specialist ownership and previous-status predicates remain in the update service. No optimistic success is shown for an unconfirmed write.

## Validation and limits
71 unit/service tests, configured JS/JSX lint, production build and diff checks pass. The new tests cover server filter composition before pagination, invalid filters, leap dates and inclusive/one-sided ranges. TSX is compiled by the build; full TypeScript checking is not configured.

No hosted schema, role or RLS changes were made. Browser account journeys and mobile/keyboard checks are still pending. Component cancellation and double-click behavior are implemented but have not been browser-verified. Owner sign-in remains deferred by request.

This increment does not complete the scheduling backend: availability, rescheduling, server-enforced overlap protection, explicit clinic timezone/UTC migration, and notification delivery still require implementation and live schema/policy verification. Existing stored date/time values are displayed without conversion. Do not label these as Cairo times until stored semantics are verified.

## Next acceptance checks
- Filter across more than 20 synthetic sessions; confirm first/last date inclusion and pagination in both directions.
- Apply a new filter during a slow request; only the latest result should appear.
- Cancel the confirmation without a write, then confirm and verify persistence after reload.
- Double-click each transition; verify one request and scoped status updates, including a stale status conflict.
- Check database isolation using separate family and specialist accounts, plus responsive layouts at 360/390/768/1200/1440.

## Scheduling update — 2026-11-04

Specialists can move a scheduled session to another date and time. The RPC uses the signed-in specialist, existing row policies and the previously displayed date and time to reject stale edits. New bookings and moves use Cairo clinic time. Legacy appointment times are preserved. The family history continues to display those values as stored.

The pending migration adds separate PostgreSQL exclusion constraints for active sessions of a child and a specialist. Slot ends are exclusive, so back-to-back appointments are valid. Existing active overlaps or unsupported legacy values abort the migration transaction. On a staging copy, inspect active records, confirm the date column is date and the time column contains supported local clock values, then test with actual roles before hosted rollout. Creating the constraints locks the sessions table. The migration requires btree_gist. The rescheduling control reports unavailability until the matching RPC exists.

The SQL scenarios ran against a disposable PGlite PostgreSQL database with synthetic UUIDs, date and text time columns, and a test auth.uid() function. They cover both overlap constraints, an adjacent appointment, a conflicting move, moving a different specialist's booking, a successful move, a stale edit, and reuse of a cancelled slot. This fixture does not reproduce hosted RLS, multiple database connections or historical timezone data. Hosted deployment and authenticated browser acceptance remain pending.
