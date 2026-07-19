# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a platform operator an `admin` role with a dashboard to view/moderate users, jobs, and the PayFast platform-fee ledger, backed by an audit trail.

**Architecture:** Additive Drizzle schema changes (new `admin` role value, `user_status`, `waived` fee status, `admin_actions` audit table) + a new `/dashboard/admin/*` route tree gated by role, following the existing per-page `getCurrentUser()`/`redirect()` pattern already used throughout `src/app/dashboard/*`. Admin mutations go through new `/api/admin/*` routes behind a new `requireAdmin()` helper, mirroring the existing `requireUser()`/`withAuth` pattern in `src/lib/auth.ts` and `src/lib/api.ts`.

**Tech Stack:** Next.js App Router (Server Components + Route Handlers), Drizzle ORM, PostgreSQL (Supabase), Tailwind, Playwright for e2e.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-19-admin-dashboard-design.md` — every requirement in it must map to a task below.
- Follow existing code style exactly: double quotes, 2-space indent, no semicolon omission, named exports, `"use client"` only where needed.
- All new API routes wrap their handler in `withAuth(...)` from `src/lib/api.ts`, same as every existing route.
- Every schema change goes through `npx drizzle-kit generate` (never hand-written migrations) — this repo has one prior migration (`drizzle/0000_add_platform_fee.sql`) generated this way.
- No new test framework decisions — Playwright is already installed and configured (`playwright.config.ts`, `npm run test:e2e`).
- Money is always in Rand, integer cents-free (whole Rand), formatted via `formatCurrency` from `src/lib/utils.ts`. Never hardcode currency formatting.

---

### Task 1: Schema changes and migration

**Files:**
- Modify: `src/db/schema.ts`

**Interfaces:**
- Produces: `userStatusEnum`, `adminActionTypeEnum`, `adminTargetTypeEnum` (new `pgEnum`s), `users.status` column, `bids.adminNote` column, `platformFeeStatusEnum` gains `"waived"`, `userRoleEnum` gains `"admin"`, new `adminActions` table + `AdminAction` type, `adminActionsRelations`.

- [ ] **Step 1: Add the new/extended enums**

In `src/db/schema.ts`, replace lines 15 and 28-31:

```ts
export const userRoleEnum = pgEnum("user_role", ["client", "professional"]);
```
```ts
export const platformFeeStatusEnum = pgEnum("platform_fee_status", [
  "pending",
  "paid",
]);
```

with:

```ts
export const userRoleEnum = pgEnum("user_role", ["client", "professional", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const platformFeeStatusEnum = pgEnum("platform_fee_status", [
  "pending",
  "paid",
  "waived",
]);
export const adminActionTypeEnum = pgEnum("admin_action_type", [
  "suspend_user",
  "reinstate_user",
  "cancel_job",
  "mark_fee_paid",
  "waive_fee",
]);
export const adminTargetTypeEnum = pgEnum("admin_target_type", ["user", "job", "bid"]);
```

- [ ] **Step 2: Add `status` to `users` and `adminNote` to `bids`**

In the `users` table definition (currently lines 33-48), add `status` right after `role`:

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  name: varchar("name", { length: 120 }).notNull(),
  // ...rest unchanged
```

In the `bids` table definition, add `adminNote` right after `platformFeePaidAt` (currently line 110):

```ts
    platformFeePaidAt: timestamp("platform_fee_paid_at", { withTimezone: true }),
    adminNote: text("admin_note"),
```

- [ ] **Step 3: Add the `admin_actions` table**

Add this after the `proPhotos` table definition (after line 139, before the `usersRelations` block):

```ts
export const adminActions = pgTable(
  "admin_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: adminActionTypeEnum("action_type").notNull(),
    targetType: adminTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("admin_actions_created_idx").on(table.createdAt)],
);
```

Note: `targetId` intentionally has no foreign key — it points at `users`, `jobs`, or `bids` depending on `targetType`, and the audit row must survive even if the target row is later deleted.

- [ ] **Step 4: Wire up relations and types**

Add to `usersRelations` (currently lines 141-146), inserting `adminActions: many(adminActions),` after `photos: many(proPhotos),`:

```ts
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  bids: many(bids),
  sessions: many(sessions),
  photos: many(proPhotos),
  adminActions: many(adminActions),
}));
```

Add after `sessionsRelations` (currently ends line 164):

```ts
export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, { fields: [adminActions.adminId], references: [users.id] }),
}));
```

Add to the type exports at the bottom of the file (currently lines 166-173):

```ts
export type AdminAction = typeof adminActions.$inferSelect;
export type UserStatus = User["status"];
```

- [ ] **Step 5: Generate the migration**

Run:
```bash
npx drizzle-kit generate
```
Expected: a new file `drizzle/0001_<random-name>.sql` containing `ALTER TYPE ... ADD VALUE`, `ALTER TABLE users ADD COLUMN status ...`, `ALTER TABLE bids ADD COLUMN admin_note ...`, `CREATE TABLE admin_actions ...`.

Rename it for clarity:
```bash
mv drizzle/0001_*.sql drizzle/0001_add_admin_dashboard.sql
```
Update the `tag` field for that entry in `drizzle/meta/_journal.json` to `"0001_add_admin_dashboard"` to match (open the file, find the entry with `"idx": 1`, edit its `"tag"` value).

- [ ] **Step 6: Apply the migration to the Supabase dev database**

```bash
node -e "
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migration applied successfully');
  await pool.end();
})().catch((err) => { console.error('Migration failed:', err); process.exit(1); });
"
```
Expected: `Migration applied successfully`. (Note: Postgres cannot add an enum value and use it in the same transaction — if this errors with `unsafe use of new value ... before it has been committed`, split the migration file into two statement-breakpoint-separated files by running `drizzle-kit generate` again after committing, or apply the `ALTER TYPE ... ADD VALUE` statements manually first via a one-off `pool.query(...)` call, then re-run `migrate`.)

- [ ] **Step 7: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/db/schema.ts drizzle/
git commit -m "Add admin role, user status, waived fee status, and admin_actions table"
```

---

### Task 2: Auth helpers — `requireAdmin`, suspended-user lockout, `ApiForbiddenError`

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/api.ts`

**Interfaces:**
- Consumes: `db`, `users`, `sessions` from `src/db/schema.ts` (Task 1)
- Produces: `requireAdmin(): Promise<User>`, `class ApiForbiddenError extends Error`. `getCurrentUser()` now returns `null` for a suspended user (so every existing SSR page and API route that calls it treats them as logged out).

- [ ] **Step 1: Reject suspended users in `getCurrentUser()`**

In `src/lib/auth.ts`, modify the `getCurrentUser` function (currently lines 48-61):

```ts
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0]?.user ?? null;
  if (user?.status === "suspended") return null;
  return user;
}
```

- [ ] **Step 2: Add `ApiForbiddenError` and `requireAdmin()`**

In `src/lib/auth.ts`, after the existing `ApiAuthError` class (currently lines 72-76), add:

```ts
export class ApiForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

/** For admin API routes: returns the user or throws a Response with 401/403. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new ApiForbiddenError();
  }
  return user;
}
```

- [ ] **Step 3: Handle `ApiForbiddenError` in `withAuth`**

In `src/lib/api.ts`, modify the `withAuth` function (currently lines 16-30):

```ts
export function withAuth<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiAuthError) {
        return jsonError("You must be signed in to do that.", 401);
      }
      if (err instanceof ApiForbiddenError) {
        return jsonError("You don't have permission to do that.", 403);
      }
      console.error(err);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}
```

Update the import at the top of `src/lib/api.ts` (currently line 1):

```ts
import { ApiAuthError, ApiForbiddenError } from "@/lib/auth";
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/lib/auth.ts src/lib/api.ts
git commit -m "Add requireAdmin, ApiForbiddenError, and suspended-user session lockout"
```

---

### Task 3: Types and serializers for admin data

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/serialize.ts`

**Interfaces:**
- Produces: `AdminUserRow`, `AdminJobRow`, `AdminFeeRow`, `AdminActionRow`, `AdminOverviewCounts` types; `toAdminUserRow()`, `toAdminJobRow()`, `toAdminFeeRow()`, `toAdminActionRow()` serializer functions.

- [ ] **Step 1: Add types**

Append to `src/lib/types.ts`:

```ts
export interface AdminUserRow {
  id: string;
  role: UserRole;
  status: "active" | "suspended";
  name: string;
  email: string;
  location: string | null;
  rating: string | null;
  jobsCompleted: number;
  createdAt: string;
}

export interface AdminJobRow {
  id: string;
  title: string;
  status: JobStatus;
  category: string;
  budgetMin: number;
  budgetMax: number;
  clientName: string;
  createdAt: string;
}

export interface AdminFeeRow {
  bidId: string;
  jobId: string;
  jobTitle: string;
  proName: string;
  bidAmount: number;
  feeAmount: number;
  feeStatus: "pending" | "paid" | "waived";
  paidAt: string | null;
  adminNote: string | null;
}

export interface AdminActionRow {
  id: string;
  adminName: string;
  actionType: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: string;
  createdAgo: string;
}

export interface AdminOverviewCounts {
  openJobs: number;
  pendingFees: number;
  totalClients: number;
  totalPros: number;
  suspendedUsers: number;
}
```

- [ ] **Step 2: Add serializers**

Append to `src/lib/serialize.ts` (add the new type imports to the existing `import type { ... } from "@/lib/types"` line at the top, and add `AdminAction` to the `@/db/schema` type import):

```ts
export function toAdminUserRow(user: User): AdminUserRow {
  return {
    id: user.id,
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email,
    location: user.location,
    rating: user.rating,
    jobsCompleted: user.jobsCompleted,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAdminJobRow(job: Job, clientName: string): AdminJobRow {
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    category: job.category,
    budgetMin: job.budgetMin,
    budgetMax: job.budgetMax,
    clientName,
    createdAt: job.createdAt.toISOString(),
  };
}

export function toAdminFeeRow(
  bid: Bid,
  jobTitle: string,
  proName: string,
): AdminFeeRow {
  return {
    bidId: bid.id,
    jobId: bid.jobId,
    jobTitle,
    proName,
    bidAmount: bid.amount,
    feeAmount: bid.platformFeeAmount ?? 0,
    feeStatus: (bid.platformFeeStatus ?? "pending") as "pending" | "paid" | "waived",
    paidAt: bid.platformFeePaidAt?.toISOString() ?? null,
    adminNote: bid.adminNote,
  };
}

export function toAdminActionRow(action: AdminAction, adminName: string): AdminActionRow {
  return {
    id: action.id,
    adminName,
    actionType: action.actionType,
    targetType: action.targetType,
    targetId: action.targetId,
    note: action.note,
    createdAt: action.createdAt.toISOString(),
    createdAgo: timeAgo(action.createdAt),
  };
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/lib/types.ts src/lib/serialize.ts
git commit -m "Add admin data types and serializers"
```

---

### Task 4: Admin nav and role gating on existing dashboard pages

**Files:**
- Modify: `src/components/dashboard/shell.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/jobs/page.tsx`
- Modify: `src/app/dashboard/jobs/new/page.tsx`
- Modify: `src/app/dashboard/jobs/[id]/page.tsx`
- Modify: `src/app/dashboard/bids/page.tsx`
- Modify: `src/app/dashboard/profile/page.tsx`

**Interfaces:**
- Consumes: `SessionUser` from `src/lib/types.ts` (existing)
- Produces: admin users are redirected to `/dashboard/admin` from every non-admin dashboard page; the sidebar shows an admin-specific nav when `role === "admin"`.

- [ ] **Step 1: Give admins their own nav branch**

In `src/components/dashboard/shell.tsx`, add `CircleDollarSign` and `Users` to the lucide-react import (currently lines 4-14):

```ts
import {
  Briefcase,
  CircleDollarSign,
  CirclePlus,
  Compass,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
```

Replace the `navItems` function (currently lines 30-47):

```ts
function navItems(role: SessionUser["role"]): NavItem[] {
  if (role === "admin") {
    return [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/admin/users", label: "Users", icon: Users, exact: true },
      { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase, exact: true },
      { href: "/dashboard/admin/fees", label: "Fees", icon: CircleDollarSign, exact: true },
    ];
  }
  const base: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  ];
  if (role === "client") {
    base.push(
      { href: "/dashboard/jobs", label: "My Jobs", icon: Briefcase, exact: true },
      { href: "/dashboard/jobs/new", label: "Post a Job", icon: CirclePlus, exact: true },
    );
  } else {
    base.push(
      { href: "/dashboard/jobs", label: "Find Jobs", icon: Compass },
      { href: "/dashboard/bids", label: "My Bids", icon: Gavel, exact: true },
    );
  }
  base.push({ href: "/dashboard/profile", label: "Profile", icon: UserRound, exact: true });
  return base;
}
```

Update the role badge chip (currently lines 74-85) to add an admin variant:

```tsx
      <div className="px-5 pb-2 pt-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset",
            user.role === "professional"
              ? "bg-gold/10 text-gold ring-gold/25"
              : user.role === "admin"
                ? "bg-ink/10 text-ink ring-ink/25"
                : "bg-brand/15 text-brand ring-brand/30",
          )}
        >
          {user.role === "professional" ? "Professional" : user.role === "admin" ? "Admin" : "Client"}
        </span>
      </div>
```

- [ ] **Step 2: Redirect admins away from the client/pro overview**

In `src/app/dashboard/page.tsx`, modify the top of `DashboardOverview` (currently lines 31-40):

```ts
export default async function DashboardOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role === "admin") redirect("/dashboard/admin");

  return user.role === "client" ? (
    <ClientOverview userId={user.id} name={user.name} />
  ) : (
    <ProOverview userId={user.id} name={user.name} specialties={user.specialties} />
  );
}
```

- [ ] **Step 3: Redirect admins away from the remaining client/pro pages**

In each of `src/app/dashboard/jobs/page.tsx`, `src/app/dashboard/jobs/new/page.tsx`, `src/app/dashboard/jobs/[id]/page.tsx`, `src/app/dashboard/bids/page.tsx`, `src/app/dashboard/profile/page.tsx`: find the existing `if (!user) redirect("/auth/login");` line and add immediately after it:

```ts
  if (user.role === "admin") redirect("/dashboard/admin");
```

(`redirect` and `getCurrentUser` are already imported in all five files — no new imports needed.)

- [ ] **Step 4: Manual check**

```bash
npm run dev
```
In another terminal, promote a seeded user to admin directly (there's no seeded admin yet — Task 10 adds one; for now just confirm the app still builds and the existing client/pro flows are unaffected):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/shell.tsx src/app/dashboard/page.tsx src/app/dashboard/jobs/page.tsx src/app/dashboard/jobs/new/page.tsx "src/app/dashboard/jobs/[id]/page.tsx" src/app/dashboard/bids/page.tsx src/app/dashboard/profile/page.tsx
git commit -m "Add admin nav branch and gate admins off client/pro dashboard pages"
```

---

### Task 5: `NoteDialog` shared UI component

**Files:**
- Create: `src/components/ui/note-dialog.tsx`

**Interfaces:**
- Consumes: `Dialog` from `src/components/ui/dialog.tsx`, `Button` from `src/components/ui/button.tsx`, `Field`/`Textarea` from `src/components/ui/field.tsx` (all existing)
- Produces: `NoteDialog` component — like `ConfirmDialog` but collects a required note before confirming. Used by force-cancel (Task 8) and mark-paid/waive (Task 9).

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";

export function NoteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
}) {
  const [note, setNote] = useState("");
  const fieldId = useId();
  const trimmed = note.trim();

  function handleClose() {
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title={title} description={description}>
      <Field label="Reason" htmlFor={fieldId} hint="Required — shown in the admin activity log.">
        <Textarea
          id={fieldId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why are you taking this action?"
          disabled={loading}
        />
      </Field>
      <div className="mt-4 flex items-center justify-end gap-2.5">
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          loading={loading}
          disabled={trimmed.length === 0}
          onClick={() => void onConfirm(trimmed)}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/components/ui/note-dialog.tsx
git commit -m "Add NoteDialog component for admin actions requiring a reason"
```

---

### Task 6: Admin overview page

**Files:**
- Create: `src/app/dashboard/admin/page.tsx`

**Interfaces:**
- Consumes: `getCurrentUser` (`src/lib/auth.ts`), `db`, `users`, `jobs`, `bids`, `adminActions` (`src/db/schema.ts`), `toAdminActionRow` (`src/lib/serialize.ts`), `StatCard` (`src/components/dashboard/stat-card.tsx`), `PageHeader` (`src/components/dashboard/page-header.tsx`)

- [ ] **Step 1: Write the page**

```tsx
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Briefcase, CircleDollarSign, ShieldBan, UserRound, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/db";
import { adminActions, bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminActionRow } from "@/lib/serialize";

export const metadata: Metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [openJobs, pendingFees, clientCount, proCount, suspendedCount, recentActions] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(eq(jobs.status, "open")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bids)
        .where(eq(bids.platformFeeStatus, "pending")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, "client")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, "professional")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.status, "suspended")),
      db
        .select({ action: adminActions, adminName: users.name })
        .from(adminActions)
        .innerJoin(users, eq(adminActions.adminId, users.id))
        .orderBy(desc(adminActions.createdAt))
        .limit(8),
    ]);

  const actionRows = recentActions.map((r) => toAdminActionRow(r.action, r.adminName));

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Platform health at a glance, and the latest moderation activity."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={Briefcase} label="Open jobs" value={openJobs[0]?.count ?? 0} tone="brand" />
        <StatCard
          icon={CircleDollarSign}
          label="Pending fees"
          value={pendingFees[0]?.count ?? 0}
          tone="gold"
          emphasize={(pendingFees[0]?.count ?? 0) > 0}
        />
        <StatCard icon={UserRound} label="Clients" value={clientCount[0]?.count ?? 0} tone="ink" />
        <StatCard icon={Users} label="Pros" value={proCount[0]?.count ?? 0} tone="ink" />
        <StatCard
          icon={ShieldBan}
          label="Suspended"
          value={suspendedCount[0]?.count ?? 0}
          tone="gold"
          emphasize={(suspendedCount[0]?.count ?? 0) > 0}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Recent admin activity
        </h2>
        {actionRows.length === 0 ? (
          <EmptyState
            icon={ShieldBan}
            title="No admin actions yet"
            description="Suspensions, cancellations, and fee overrides will show up here."
          />
        ) : (
          <div className="space-y-2.5">
            {actionRows.map((a) => (
              <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-[13px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">{a.adminName}</span>{" "}
                  {a.actionType.replace(/_/g, " ")} · {a.targetType} {a.targetId.slice(0, 8)}
                </p>
                {a.note ? (
                  <p className="mt-1 text-xs text-ink-3">&ldquo;{a.note}&rdquo;</p>
                ) : null}
                <p className="mt-1 text-xs text-ink-3">{a.createdAgo}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/app/dashboard/admin/page.tsx
git commit -m "Add admin overview page"
```

---

### Task 7: Admin users page + suspend/reinstate API

**Files:**
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/dashboard/admin/users/page.tsx`
- Create: `src/components/dashboard/admin-user-actions.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `withAuth`/`jsonError`/`readJson` (`src/lib/api.ts`), `AdminUserRow` (Task 3)
- Produces: `PATCH /api/admin/users/[id]` — body `{ action: "suspend" | "reinstate", note?: string }`

- [ ] **Step 1: Write the API route**

```ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, users } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return jsonError("User not found.", 404);

  const body = await readJson<{ action?: "suspend" | "reinstate"; note?: string }>(req);
  if (!body?.action || (body.action !== "suspend" && body.action !== "reinstate"))
    return jsonError("Unknown action.", 400);

  const nextStatus = body.action === "suspend" ? "suspended" : "active";
  if (target.status === nextStatus)
    return jsonError(`User is already ${nextStatus}.`, 400);

  await db.update(users).set({ status: nextStatus }).where(eq(users.id, id));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: body.action === "suspend" ? "suspend_user" : "reinstate_user",
    targetType: "user",
    targetId: id,
    note: body.note?.trim() || null,
  });

  return Response.json({ ok: true, status: nextStatus });
});
```

- [ ] **Step 2: Write the row-actions client component**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AdminUserRow } from "@/lib/types";

export function AdminUserActions({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isSuspended = user.status === "suspended";
  const action = isSuspended ? "reinstate" : "suspend";

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      toast.success(isSuspended ? "User reinstated." : "User suspended.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={isSuspended ? "secondary" : "danger"}
        onClick={() => setOpen(true)}
      >
        {isSuspended ? "Reinstate" : "Suspend"}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={run}
        title={isSuspended ? "Reinstate this user?" : "Suspend this user?"}
        description={
          isSuspended
            ? "They'll regain access on their next request."
            : "They'll be signed out on their next request. Their jobs and bids are left as-is."
        }
        confirmLabel={isSuspended ? "Reinstate" : "Suspend"}
        tone={isSuspended ? "primary" : "danger"}
        loading={busy}
      />
    </>
  );
}
```

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminUserActions } from "@/components/dashboard/admin-user-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminUserRow } from "@/lib/serialize";

export const metadata: Metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const rows = allUsers.map(toAdminUserRow);

  return (
    <div>
      <PageHeader title="Users" description="Every client and pro on the platform." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Jobs completed</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-ink-3">{u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink-2">{u.role}</td>
                <td className="px-4 py-3">
                  <Pill
                    className={
                      u.status === "suspended"
                        ? "bg-danger-soft text-danger ring-danger/25"
                        : "bg-success-soft text-success ring-success/25"
                    }
                  >
                    {u.status}
                  </Pill>
                </td>
                <td className="px-4 py-3 text-ink-2">{u.jobsCompleted}</td>
                <td className="px-4 py-3 text-ink-2">{u.rating ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {u.role === "admin" ? null : <AdminUserActions user={u} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add "src/app/api/admin/users/[id]/route.ts" src/app/dashboard/admin/users/page.tsx src/components/dashboard/admin-user-actions.tsx
git commit -m "Add admin users page with suspend/reinstate"
```

---

### Task 8: Admin jobs page + force-cancel API

**Files:**
- Create: `src/app/api/admin/jobs/[id]/route.ts`
- Create: `src/app/dashboard/admin/jobs/page.tsx`
- Create: `src/components/dashboard/admin-job-actions.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `NoteDialog` (Task 5), `AdminJobRow` (Task 3)
- Produces: `PATCH /api/admin/jobs/[id]` — body `{ action: "cancel", note: string }` (note required)

- [ ] **Step 1: Write the API route**

```ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, bids, jobs } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return jsonError("Job not found.", 404);

  const body = await readJson<{ action?: "cancel"; note?: string }>(req);
  if (body?.action !== "cancel") return jsonError("Unknown action.", 400);
  const note = body.note?.trim() ?? "";
  if (note.length === 0) return jsonError("A reason is required.", 400);

  if (job.status === "cancelled" || job.status === "completed")
    return jsonError("This job can no longer be cancelled.", 400);

  await db.update(jobs).set({ status: "cancelled", updatedAt: new Date() }).where(eq(jobs.id, id));
  await db
    .update(bids)
    .set({ status: "declined", updatedAt: new Date() })
    .where(and(eq(bids.jobId, id), eq(bids.status, "pending")));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: "cancel_job",
    targetType: "job",
    targetId: id,
    note,
  });

  return Response.json({ ok: true, status: "cancelled" });
});
```

- [ ] **Step 2: Write the row-actions client component**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "@/components/ui/note-dialog";
import type { AdminJobRow } from "@/lib/types";

export function AdminJobActions({ job }: { job: AdminJobRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancellable = job.status !== "cancelled" && job.status !== "completed";

  async function run(note: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      toast.success("Job force-cancelled.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!cancellable) return null;

  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Force-cancel
      </Button>
      <NoteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={run}
        title="Force-cancel this job?"
        description="Pending bids are released. This overrides the client's own control of the job — record why."
        confirmLabel="Cancel job"
        tone="danger"
        loading={busy}
      />
    </>
  );
}
```

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminJobActions } from "@/components/dashboard/admin-job-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryPill, JobStatusPill } from "@/components/ui/pill";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminJobRow } from "@/lib/serialize";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Jobs" };
export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ job: jobs, clientName: users.name })
    .from(jobs)
    .innerJoin(users, eq(jobs.clientId, users.id))
    .orderBy(desc(jobs.createdAt));
  const jobRows = rows.map((r) => toAdminJobRow(r.job, r.clientName));

  return (
    <div>
      <PageHeader title="Jobs" description="Every job posted on the platform." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {jobRows.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0">
                <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">{j.title}</td>
                <td className="px-4 py-3 text-ink-2">{j.clientName}</td>
                <td className="px-4 py-3">
                  <CategoryPill value={j.category} />
                </td>
                <td className="px-4 py-3 text-ink-2">
                  {formatCurrency(j.budgetMin)}–{formatCurrency(j.budgetMax)}
                </td>
                <td className="px-4 py-3">
                  <JobStatusPill status={j.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminJobActions job={j} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add "src/app/api/admin/jobs/[id]/route.ts" src/app/dashboard/admin/jobs/page.tsx src/components/dashboard/admin-job-actions.tsx
git commit -m "Add admin jobs page with force-cancel"
```

---

### Task 9: Admin fees page + mark-paid/waive API + ITN waived-guard fix

**Files:**
- Create: `src/app/api/admin/fees/[bidId]/route.ts`
- Create: `src/app/dashboard/admin/fees/page.tsx`
- Create: `src/components/dashboard/admin-fee-actions.tsx`
- Modify: `src/app/api/payments/payfast/notify/route.ts:56`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `NoteDialog` (Task 5), `AdminFeeRow` (Task 3)
- Produces: `PATCH /api/admin/fees/[bidId]` — body `{ action: "mark_paid" | "waive", note: string }` (note required)

- [ ] **Step 1: Write the API route**

```ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, bids } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ bidId: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { bidId } = await params;

  const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
  if (!bid) return jsonError("Bid not found.", 404);
  if (bid.platformFeeStatus === null)
    return jsonError("This bid has no platform fee.", 400);

  const body = await readJson<{ action?: "mark_paid" | "waive"; note?: string }>(req);
  if (body?.action !== "mark_paid" && body?.action !== "waive")
    return jsonError("Unknown action.", 400);
  const note = body.note?.trim() ?? "";
  if (note.length === 0) return jsonError("A reason is required.", 400);

  if (bid.platformFeeStatus !== "pending")
    return jsonError(`Fee is already ${bid.platformFeeStatus}.`, 400);

  const nextStatus = body.action === "mark_paid" ? "paid" : "waived";
  await db
    .update(bids)
    .set({
      platformFeeStatus: nextStatus,
      platformFeePaidAt: body.action === "mark_paid" ? new Date() : bid.platformFeePaidAt,
      adminNote: note,
      updatedAt: new Date(),
    })
    .where(eq(bids.id, bidId));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: body.action === "mark_paid" ? "mark_fee_paid" : "waive_fee",
    targetType: "bid",
    targetId: bidId,
    note,
  });

  return Response.json({ ok: true, status: nextStatus });
});
```

- [ ] **Step 2: Fix the PayFast ITN guard so a stale webhook can't override a waiver**

In `src/app/api/payments/payfast/notify/route.ts`, line 56, change:

```ts
    if (bid.platformFeeStatus !== "paid") {
```

to:

```ts
    if (bid.platformFeeStatus !== "paid" && bid.platformFeeStatus !== "waived") {
```

- [ ] **Step 3: Write the row-actions client component**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "@/components/ui/note-dialog";
import type { AdminFeeRow } from "@/lib/types";

type PendingAction = "mark_paid" | "waive" | null;

export function AdminFeeActions({ fee }: { fee: AdminFeeRow }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  async function run(note: string) {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/fees/${fee.bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pending, note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      const action = pending;
      setPending(null);
      toast.success(action === "mark_paid" ? "Fee marked paid." : "Fee waived.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (fee.feeStatus !== "pending") return null;

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPending("waive")}>
          Waive
        </Button>
        <Button size="sm" onClick={() => setPending("mark_paid")}>
          Mark paid
        </Button>
      </div>
      <NoteDialog
        open={pending === "mark_paid"}
        onClose={() => setPending(null)}
        onConfirm={run}
        title="Mark this fee as paid?"
        description="Use this for fees settled outside PayFast (e.g. offline). Record how."
        confirmLabel="Mark paid"
        loading={busy}
      />
      <NoteDialog
        open={pending === "waive"}
        onClose={() => setPending(null)}
        onConfirm={run}
        title="Waive this fee?"
        description="The pro will no longer owe this platform fee. Record why."
        confirmLabel="Waive fee"
        tone="danger"
        loading={busy}
      />
    </>
  );
}
```

- [ ] **Step 4: Write the page**

```tsx
import type { Metadata } from "next";
import { desc, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminFeeActions } from "@/components/dashboard/admin-fee-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminFeeRow } from "@/lib/serialize";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Fees" };
export const dynamic = "force-dynamic";

const FEE_TONE: Record<string, string> = {
  pending: "bg-warning-soft text-warning-ink ring-warning/25",
  paid: "bg-success-soft text-success ring-success/25",
  waived: "bg-ink/10 text-ink-2 ring-ink/15",
};

export default async function AdminFeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ bid: bids, jobTitle: jobs.title, proName: users.name })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .innerJoin(users, eq(bids.proId, users.id))
    .where(isNotNull(bids.platformFeeStatus))
    .orderBy(desc(bids.updatedAt));
  const feeRows = rows.map((r) => toAdminFeeRow(r.bid, r.jobTitle, r.proName));

  return (
    <div>
      <PageHeader title="Platform fees" description="Every fee owed on an accepted, completed bid." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Pro</th>
              <th className="px-4 py-3">Bid</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {feeRows.map((f) => (
              <tr key={f.bidId} className="border-b border-line last:border-0">
                <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">{f.jobTitle}</td>
                <td className="px-4 py-3 text-ink-2">{f.proName}</td>
                <td className="px-4 py-3 text-ink-2">{formatCurrency(f.bidAmount)}</td>
                <td className="px-4 py-3 text-ink-2">{formatCurrency(f.feeAmount)}</td>
                <td className="px-4 py-3">
                  <Pill className={FEE_TONE[f.feeStatus]}>{f.feeStatus}</Pill>
                </td>
                <td className="px-4 py-3">
                  <AdminFeeActions fee={f} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit
git add "src/app/api/admin/fees/[bidId]/route.ts" src/app/dashboard/admin/fees/page.tsx src/components/dashboard/admin-fee-actions.tsx src/app/api/payments/payfast/notify/route.ts
git commit -m "Add admin fees page with mark-paid/waive, fix ITN guard for waived fees"
```

---

### Task 10: Seed script — admin and suspended demo users

**Files:**
- Modify: `src/db/seed.ts`

**Interfaces:**
- Produces: two more seeded users — `admin@glossdemo.com` (role `admin`) and one existing client flipped to `status: "suspended"` for manual/e2e testing of the lockout.

- [ ] **Step 1: Import `eq` statically and drop the later dynamic import**

`src/db/seed.ts` currently imports only `desc` at the top (line 2) and dynamically imports `eq` deep inside `main()` (line 806: `const { eq } = await import("drizzle-orm");`) purely to wire up `awardedBidId`. Consolidate to a single static import.

Change line 2 from:
```ts
import { desc } from "drizzle-orm";
```
to:
```ts
import { desc, eq } from "drizzle-orm";
```

Delete line 806 (`const { eq } = await import("drizzle-orm");`) and the blank comment line above it (`// Wire awarded jobs to their accepted bids` stays — only the dynamic import line goes).

- [ ] **Step 2: Add an admin user to the client insert**

Leave the destructuring line (currently line 28, `const [ava, rachel, danielle, morgan, natalie, simone, grace, vanessa] =`) unchanged — positional array destructuring can leave trailing returned rows uncaptured, and nothing later needs to reference the admin row directly.

Add a new object to the end of that insert's `.values([...])` array, immediately after the `Vanessa Ortiz` entry (currently lines 96-103) and before the closing `])` (line 104):

```ts
        {
          role: "admin" as const,
          name: "Admin User",
          email: "admin@glossdemo.com",
          passwordHash: demoPassword,
          location: "Sandton",
          avatarHue: 0,
        },
```

- [ ] **Step 3: Suspend Danielle Carter for testing the lockout**

Immediately after that same insert's `.returning();` (currently line 105), add:

```ts

  console.log("Suspending one demo user for testing…");
  await db.update(users).set({ status: "suspended" }).where(eq(users.id, danielle.id));
```

- [ ] **Step 4: Update the final log line**

Change the existing log line (currently lines 823-825):
```ts
  console.log(
    `Seeded ${18} users, ${jobCount} jobs, ${bidCount} bids. Demo login: ava@glossdemo.com / amara@glossdemo.com - password: demo1234`,
  );
```
to:
```ts
  console.log(
    `Seeded 19 users, ${jobCount} jobs, ${bidCount} bids. Demo login: ava@glossdemo.com / amara@glossdemo.com - password: demo1234. Admin login: admin@glossdemo.com - password: demo1234. danielle@glossdemo.com is suspended for testing.`,
  );
```

- [ ] **Step 5: Run the seed and verify**

```bash
npm run db:seed
```
Expected output includes `Admin login: admin@glossdemo.com` and no errors.

Verify directly:
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query(\"select email, role, status from users where role = 'admin' or status = 'suspended'\");
  console.table(res.rows);
  await pool.end();
})();
"
```
Expected: one row with `role: admin`, one row with `status: suspended`.

- [ ] **Step 6: Commit**

```bash
git add src/db/seed.ts
git commit -m "Seed an admin user and a suspended user for testing"
```

---

### Task 11: E2E tests

**Files:**
- Create: `e2e/admin-access.spec.ts`
- Create: `e2e/admin-actions.spec.ts`
- Create: `e2e/helpers/login.ts`

**Interfaces:**
- Consumes: seeded `admin@glossdemo.com` / `danielle@glossdemo.com` (Task 10), running dev server (`playwright.config.ts` already starts it)

- [ ] **Step 1: Write a login helper**

```ts
import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password = "demo1234") {
  await page.goto("/auth/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/);
}
```

- [ ] **Step 2: Write the access-gating test**

```ts
import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";

test.describe("admin access gating", () => {
  test("admin lands on /dashboard/admin and cannot reach client pages", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);

    await page.goto("/dashboard/jobs");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);

    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);
  });

  test("suspended user is signed out on next request", async ({ page }) => {
    await loginAs(page, "danielle@glossdemo.com");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("non-admin cannot reach the admin dashboard", async ({ page }) => {
    await loginAs(page, "ava@glossdemo.com");
    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
```

- [ ] **Step 3: Run and verify the access tests pass**

```bash
npx playwright test e2e/admin-access.spec.ts
```
Expected: `3 passed`. If the suspended-user test fails because `danielle@glossdemo.com` wasn't the user suspended in Task 10, adjust the email to match whichever seeded user Task 10 actually suspended.

- [ ] **Step 4: Write the moderation-actions test**

```ts
import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";

test.describe("admin moderation actions", () => {
  test("suspend and reinstate a user", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await page.goto("/dashboard/admin/users");

    const row = page.locator("tr", { hasText: "Rachel Kim" });
    await row.getByRole("button", { name: "Suspend" }).click();
    await page.getByRole("button", { name: "Suspend", exact: true }).last().click();
    await expect(page.getByText("User suspended.")).toBeVisible();
    await expect(row.getByText("suspended")).toBeVisible();

    await row.getByRole("button", { name: "Reinstate" }).click();
    await page.getByRole("button", { name: "Reinstate", exact: true }).last().click();
    await expect(page.getByText("User reinstated.")).toBeVisible();
    await expect(row.getByText("active")).toBeVisible();
  });

  test("force-cancel an open job", async ({ page }) => {
    await loginAs(page, "admin@glossdemo.com");
    await page.goto("/dashboard/admin/jobs");

    const row = page.locator("tbody tr").first();
    const cancelButton = row.getByRole("button", { name: "Force-cancel" });
    if ((await cancelButton.count()) === 0) test.skip();

    await cancelButton.click();
    await page.getByPlaceholder("Why are you taking this action?").fill("Duplicate posting");
    await page.getByRole("button", { name: "Cancel job" }).click();
    await expect(page.getByText("Job force-cancelled.")).toBeVisible();
  });
});
```

- [ ] **Step 5: Run and verify**

```bash
npx playwright test e2e/admin-actions.spec.ts
```
Expected: `2 passed` (the job-cancel test may `skip` if the seed data has no open jobs left after previous test runs — that's acceptable).

- [ ] **Step 6: Run the full suite and commit**

```bash
npm run test:e2e
git add e2e/
git commit -m "Add e2e tests for admin access gating and moderation actions"
```

---

## Final verification

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run test:e2e` passes
- [ ] Manual pass: log in as `admin@glossdemo.com`, confirm all four admin pages load, take one action of each type (suspend, force-cancel, mark-paid or waive), and confirm the overview page's recent-activity feed shows all three
