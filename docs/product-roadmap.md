# Tawasol: delivery roadmap

Updated 2026-10-25. This is an implementation backlog, not a list of completed capabilities.

## Product goal
Help families coordinate child activities and follow-up with qualified professionals. Children have different communication and sensory needs. Game scores and task completion are activity measures, not clinical outcomes. Clinical content, assessment workflows and professional scope require review by a licensed clinical lead before release.

## Delivery order and acceptance gates

| Stage | Capabilities | Release gate |
| --- | --- | --- |
| 1: reliable foundation | Role-based login; profile recovery; password recovery; parent/child switching; reliable tasks, mood and reward saves; factual metrics; accessible forms; logout; Arabic responsive navigation | Separate parent and specialist test accounts; RLS isolation tests; successful and failed writes; refresh persistence; 360/390/768/1200/1440 layout checks |
| 2: care coordination | Verified professional profiles; guardian consent; explicit specialist-child assignment; availability; booking; cancellation; rescheduling; appointment history; parent appointment list; reminders | Clinical/legal review of service scope; server-authorized assignment; concurrency-safe conflict prevention; clinic timezone handling; notification delivery tests |
| 3: private online sessions | Eligibility/intake form; device check; waiting room; expiring participant tokens; guardian attendance; reconnect flow; session notes; follow-up plan; recording off by default | Approved video vendor and privacy terms; unauthorized entry tests; degraded-network tests; retention policy; incident and emergency procedure |
| 4: personalized follow-up | Communication preferences; sensory preferences; visual routines; pause controls; specialist-assigned activities; family observations; goal history; reviewed progress summaries; accessible exports | Clinical review; granular record access; no diagnostic inference from stars or mood; revision/audit history |
| 5: operations and business | Service catalog; transparent prices; payment; refunds; practitioner payouts; center dashboard; support requests; complaints; consent history; staff access review; audit logs | Payment webhook verification/idempotency; reconciliation; documented cancellation rules; support ownership; data export/deletion policy |
| 6: growth | Arabic onboarding; practitioner availability search; appointment reminders; referral attribution with consent; service-quality analytics; capacity reporting; optional center subscriptions | Small supervised pilot; measured support/cost burden; privacy-preserving analytics; evidence for marketing claims |

## Current implementation facts
- React frontend and Supabase remain the existing stack.
- Authentication, task/mood tracking and basic specialist sessions/reports exist, but are not fully verified.
- Test parent login, synthetic child creation and daily-task persistence were verified on the existing preview.
- Latest local fixes confirm writes and show real counts; automated checks are not substitutes for browser or RLS tests.
- Booking validation and scoped session state confirmation are implemented locally in this delivery.
- Video, payments, professional verification, consent workflow and concurrency-safe booking are NOT implemented.

## Proposed architecture
Keep one application with clear feature boundaries: identity, family, professional, scheduling, activities, clinical records, payments, operations. Share validation/display helpers, not domain-specific permissions.

Move privileged mutations into authenticated Supabase functions or narrowly scoped database functions. Enforce access in RLS/server logic; frontend checks are usability aids only. Do not ship service-role credentials to the browser. Introduce reviewed versioned migrations after inspecting the real schema and policies.

Sessions need explicit UTC instants plus a clinic timezone, server-enforced overlap protection and authorized transitions. Reward issuance needs a transaction plus an idempotency key and server-authoritative rules. Video tokens must be created only after participant and appointment checks; never use a permanent public room link.

## Business pilot
Begin with a small cohort and qualified professionals offering a clearly described service. Track booking completion, attendance, follow-up return, family satisfaction, professional time, support load, refunds and contribution margin. Measure clinical outcomes only through professional-approved methods. Avoid forced subscriptions and unverified improvement claims.

## Implementation discipline
Each feature moves through: proposed → schema/design checked → implemented → automated checks → browser journey → permission/error tests → pilot ready. Never mark a feature done because its button or screen exists. Do not merge the current branch into production until critical account and data-isolation checks pass.
