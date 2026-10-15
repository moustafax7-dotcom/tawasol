# Tawasol review — 2026-10-15

## Release status
Frontend repair batch, not a complete production certification. The defense-time
specialist incident has not been reproduced. No production database was changed.

## Coverage and changes
| Area | Evidence and result | Remaining validation |
| --- | --- | --- |
| Build | Fixed case-sensitive prayer import; production build passes | Vercel preview and deployment |
| Authentication | Safe role routing, preserved errors, stale profile response guard, recovery screen | Signup trigger, profile provisioning, RLS and real-account journeys |
| Specialist | Query failures and session update errors displayed with retry | Actual schema relationships, create-session/report failure paths |
| Parent | Query failures surfaced, retry and add-child error handling | Cross-account isolation and concurrent child switching |
| Child | Child lookup errors distinguished from empty list; task/reward query errors checked | Persistence, concurrent writes and complete game journeys |
| Notifications | Loading/error/retry UI and constrained panel width | Write failures, keyboard focus and realtime lifecycle |
| Accessibility | Input labels/error associations, focus outlines, reduced motion | Keyboard and screen-reader audit of every dashboard/modal/game |
| Performance | Dashboards loaded separately; initial bundle reduced | Browser metrics on real devices and slow networks |
| SEO/content | Arabic language/direction/title/description; unsupported full-offline claim removed | Verify testimonials, statistics and professional claims |
| Responsive UI | Existing responsive styles inspected; notification width constrained | Visual regression at 360, 390, 768, 1200 and 1440 px |
| Maintainability | Policy tests and clean JS/JSX lint | TSX lint/typecheck, smaller dashboard components, integration tests |

## Priorities before production approval
1. **P1 / high confidence / backend access required:** inspect signup trigger and
   profiles/specialists keys, then test a dedicated specialist account. Missing
   recovery profiles are not automatically provisioned by this repair.
2. **P1 / high confidence / backend work:** verify RLS using separate parent and
   specialist accounts for every child-data table. Route guards alone are not data security.
3. **P1 / high confidence / medium effort:** game reward totals use client-side
   read/update operations. Move awarding into an authorized atomic, idempotent DB
   operation and enforce unique daily tasks. Test retries and simultaneous sessions.
4. **P1 / high confidence / medium effort:** forgot-password link targets an
   unimplemented route. Implement and test reset-email and recovery-session flows.
5. **P2 / high confidence / small-medium effort:** handle notification write failures,
   stale child requests and all session/report save exceptions explicitly.
6. **P2 / medium confidence / medium effort:** verify timer/audio cleanup and
   one-time reward completion in every game. Run keyboard, touch and reduced-motion tests.
7. **P2 / high confidence / medium effort:** add TSX quality gates and meaningful
   authenticated integration tests with isolated data; inspect deployment logs.
8. **P2 / medium confidence / medium effort:** audit dark-mode contrast, modal focus,
   RTL overflow, empty/loading states and all five screen widths in a browser.

## Recommended product sequence
- First: reliable account onboarding, specialist assignment with guardian approval,
  explicit save status and clear recovery/support instructions.
- Next: individual activity plans, factual task/session history and parent-approved
  progress exports. Avoid presenting game completion as clinical improvement.
- Then: configurable reminders, sensory controls (sound/motion), and accessible
  child-friendly navigation, tested with representative users.
- Offline use needs a designed sync/conflict/privacy strategy before advertising it.

## Acceptance gate
Run build, JS/JSX lint and policy tests. Then verify real parent/specialist/child
journeys, permission boundaries, refresh/logout, interrupted saves, duplicate game
completion and responsive screenshots on a preview deployment. These runtime and
backend checks remain outstanding; source review cannot establish their success.
