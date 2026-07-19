# Pro photo gallery + public profile page

**Date:** 2026-07-19
**Status:** approved, pending implementation

## Context

Bid for Beauty has no way for a professional to show their work. `users.location`
already exists as a free-text field and is already surfaced on job/bid cards, so
this spec does not touch location. There is currently no public-facing profile
page at all — `src/app/dashboard/profile/page.tsx` is the logged-in user's own
editable profile, not viewable by anyone else.

Chat between clients and pros is a separate, larger subsystem and is explicitly
out of scope for this spec — it gets its own brainstorm later.

## Goal

A professional can upload up to 12 photos of their work/business, reorder and
remove them, and have them show up:
1. On a new public profile page any signed-in user can view.
2. As a small thumbnail preview on their bid cards in a client's bid board, so
   a client comparing bids can see a taste of the pro's work without leaving
   the page.

## Data model

New table in `src/db/schema.ts`:

```ts
export const proPhotos = pgTable(
  "pro_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proId: uuid("pro_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("pro_photos_pro_idx").on(table.proId, table.position)],
);

export const proPhotosRelations = relations(proPhotos, ({ one }) => ({
  pro: one(users, { fields: [proPhotos.proId], references: [users.id] }),
}));
```

No captions in v1 — keeps upload UI to "pick file, see it appear." Easy to add
a `caption` column later without a migration headache.

## Storage

**Vercel Blob**, public access. The app already deploys on Vercel; this avoids
provisioning separate infra. Add `@vercel/blob` to `package.json`.

Upload flow uses `@vercel/blob/client` **direct client upload** (browser
uploads straight to Blob, not proxied through a Next.js function) so large
images don't hit serverless body-size limits:

1. Client calls `POST /api/profile/photos/upload-url` with the intended
   filename to get a signed upload token (`handleUpload` from
   `@vercel/blob/client` on the server side, following Vercel's documented
   client-upload pattern).
2. Browser uploads the file directly to Blob using that token.
3. On the client, once the upload resolves, call
   `POST /api/profile/photos` with the resulting Blob `url` to create the
   `pro_photos` row (position = current max + 1).

Deleting a photo (`DELETE /api/profile/photos/:id`) deletes both the DB row
and the Blob object (`del(url)` from `@vercel/blob`).

Reordering (`PATCH /api/profile/photos/reorder`) takes an ordered array of
photo ids belonging to the current user and rewrites `position` for each.

Constraints, enforced server-side: max 12 photos per pro, JPEG/PNG/WebP only,
8MB max per file.

## UI

**Upload/manage (in `dashboard/profile`, professional role only)**

New `PhotoGallery` client component below the existing profile form fields:
- Grid of existing photos (reuses the `rounded-2xl` panel convention).
- Each photo has a remove button (confirm via existing `ConfirmDialog`) and
  up/down reorder buttons (no drag-and-drop library in the project; simple
  index-swap buttons match `VISUAL_DENSITY` here and avoid a new dependency).
- An "Add photo" tile (dashed border, matches the existing "Post yours" tile
  pattern on the landing page categories section) opens a file picker,
  shows a small upload-in-progress state per new tile, then appends on
  success. Errors surface via the existing `sonner` toast pattern used
  elsewhere (see `bid-board.tsx`).
- Empty state: reuse `EmptyState` component ("No photos yet" / "Add a few
  photos of your work so clients can see what you do").

**Public profile page — new route `src/app/dashboard/pros/[id]/page.tsx`**

Server component, requires a session (any role) but not ownership. Shows:
name, avatar, rating, jobs completed, specialties, location, bio, and the
photo grid (read-only, `next/image`, responsive `grid-cols-2 sm:grid-cols-3`
matching the project's established "always set a base `grid-cols-N`"
convention). If a pro has zero photos, that section is omitted entirely
(no empty state needed on a page someone else is viewing).

**Bid card preview (`src/components/dashboard/bid-board.tsx`)**

Below the existing rating/jobs-done/specialties line on each bid row, when
`bid.pro` has photos: a row of up to 3 small square thumbnails
(`size-10 rounded-lg object-cover`), wrapped in a `Link` to
`/dashboard/pros/[proId]`. Requires `BidWithPro`/`ProSummary`
(`src/lib/types.ts`, `src/lib/serialize.ts`) to carry a `photos: string[]`
(just URLs, capped at 3) alongside existing fields — serialized from a
join/subquery in the job-detail page's data loading, not a new endpoint.

## Non-goals (v1)

- No photo captions or categorization.
- No drag-and-drop reordering (index-swap buttons instead).
- No image cropping/editing in-app (upload as-is; browser/OS handles pre-crop).
- No moderation/reporting flow.
- Chat is entirely out of scope, tracked separately.

## Testing / verification

- `npx tsc --noEmit` and `npm run lint` clean.
- Manual: as a pro, upload 3 photos, reorder them, delete one, confirm order
  persists on reload. As a client, open a job with a bid from that pro,
  confirm the thumbnail strip shows and links to a working public profile
  page showing all remaining photos in the saved order.
- Confirm the 12-photo cap and file-type/size validation are enforced
  server-side (not just hidden client-side).
