# Admin dashboard

## Purpose

Give a platform operator visibility and light moderation control over the marketplace: who's on it, what jobs/bids are happening, and the PayFast platform-fee ledger. No admin role exists today — this introduces one.

## Scope

In scope:
- `admin` role, granted directly on `users.role` (no separate flag)
- Admin-only dashboard section: overview, users, jobs, fee ledger
- Suspend/reinstate a user
- Force-cancel a job
- Manually mark a platform fee paid, or waive it
- An audit trail of every admin action

Out of scope (explicitly deferred):
- Editing user profile content as an admin
- Any bid-level admin actions beyond what force-cancelling the parent job covers
- A dedicated audit-log page (the overview page's recent-activity feed is enough at this scale)
- Automated tests (no test infra exists in this repo yet; verified manually — see Testing)

## Access control

- `user_role` enum gains `"admin"`. An admin is a user like any other — logs in through the existing `/auth/login` flow.
- `src/app/dashboard/layout.tsx` currently just requires a logged-in user. It needs to branch: `role === "admin"` renders the admin shell/nav; `client`/`professional` render the existing dashboard as today. An admin does not see the client/pro views — they aren't posting jobs or bidding.
- New `requireAdmin()` in `src/lib/auth.ts`, mirroring `requireUser()`: fetches the current user, throws `ApiAuthError` (401) if not logged in, throws a new `ApiForbiddenError` (403) if logged in but not `role === "admin"`.
- `requireUser()` (and therefore every existing authenticated route) is extended to also reject `users.status === "suspended"` — a suspended user's next request fails auth, without needing to hunt down and invalidate their sessions directly.

## Schema changes

All additive; one migration.

```
user_role enum: add "admin"

users:
  status  user_status enum ("active" | "suspended"), not null, default "active"

bids:
  platform_fee_status enum: add "waived" (currently "pending" | "paid")
  admin_note  text, nullable  -- denormalized copy of the mark_paid/waive note,
                              -- so the fees table can show it without joining
                              -- admin_actions (which remains the source of truth)

new table: admin_actions
  id            uuid primary key default gen_random_uuid()
  admin_id      uuid not null references users(id)
  action_type   text not null   -- "suspend_user" | "reinstate_user" | "cancel_job" | "mark_fee_paid" | "waive_fee"
  target_type   text not null   -- "user" | "job" | "bid"
  target_id     uuid not null
  note          text
  created_at    timestamptz not null default now()
```

`admin_actions` intentionally has no foreign key on `target_id` — it points at different tables depending on `target_type`, and rows should survive even if the target is later deleted.

## Routes

**Pages** (`src/app/dashboard/admin/...`):
- `/dashboard/admin` — counts (open jobs, pending fees, total pros/clients, suspended users) + recent `admin_actions` feed
- `/dashboard/admin/users` — all users: role, status, jobs/bids counts, rating; suspend/reinstate button per row
- `/dashboard/admin/jobs` — all jobs: status, client, category, budget, created date; force-cancel button per row (hidden once already cancelled/completed)
- `/dashboard/admin/fees` — all bids with a non-null `platform_fee_status`: job, pro, amount, status, paid/waived date; mark-paid/waive buttons per row (hidden once already paid/waived)

**API** (`src/app/api/admin/...`), all behind `requireAdmin()`:
- `PATCH /api/admin/users/[id]` — body `{ action: "suspend" | "reinstate", note?: string }`. Sets `users.status`. Writes one `admin_actions` row.
- `PATCH /api/admin/jobs/[id]` — body `{ action: "cancel", note: string }` (`note` required). Sets `jobs.status = "cancelled"`. Writes one `admin_actions` row.
- `PATCH /api/admin/fees/[bidId]` — body `{ action: "mark_paid" | "waive", note: string }` (`note` required). Sets `bids.platformFeeStatus` to `"paid"` or `"waived"`; `mark_paid` also stamps `platformFeePaidAt`. Writes one `admin_actions` row.

All three follow the existing `withAuth`/`jsonError` pattern from `src/lib/api.ts`. Missing required `note` → 400. Unknown target id → 404.

## Interaction with the existing PayFast ITN webhook

`src/app/api/payments/payfast/notify/route.ts` currently only flips a fee to `"paid"` when `bid.platformFeeStatus !== "paid"`. That guard must also exclude `"waived"`, so a PayFast notification that arrives after an admin has waived a fee can't silently override the waiver. One-line change to the existing condition.

## Suspension semantics

- Suspending a pro or client does not cascade to their jobs/bids — a suspended client's open jobs stay open, a suspended pro's pending bids stay pending. If those need cleanup, the admin does it explicitly (e.g. force-cancel the job).
- Suspension takes effect on the user's *next* authenticated request (via the `requireUser()` status check), not immediately — there's no session-invalidation step, which keeps this simple and is an acceptable trade-off for a moderation action rather than a security lockout.

## Error handling

- `requireAdmin()`: 401 if unauthenticated, 403 if authenticated but not an admin.
- All three admin PATCH routes: 400 on missing required `note`, 404 on unknown target id, 401/403 via `requireAdmin()`.
- Errors surface through the existing `jsonError` helper and are shown via the existing toast patterns already used elsewhere in the dashboard.

## Testing

No Playwright/Vitest suite exists in this repo. Verification is manual, against the dev database:
1. Promote a test user to `role = "admin"` directly in the DB, confirm they land on `/dashboard/admin` and cannot reach `/dashboard/jobs` etc.
2. Suspend a test user, confirm their next authenticated request (e.g. loading `/dashboard`) is rejected; reinstate, confirm access returns.
3. Force-cancel an open job as admin, confirm `jobs.status` flips and the job owner's UI reflects it.
4. Mark a pending fee paid, and separately waive a different pending fee; confirm `platform_fee_status` and `platform_fee_paid_at`/note land correctly, and that each shows the right state on `/dashboard/admin/fees`.
5. Confirm `admin_actions` gets one row per action above, and the overview page's recent-activity feed reflects them.
