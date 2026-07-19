import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["client", "professional"]);
export const jobStatusEnum = pgEnum("job_status", [
  "open",
  "awarded",
  "completed",
  "cancelled",
]);
export const bidStatusEnum = pgEnum("bid_status", [
  "pending",
  "accepted",
  "declined",
  "withdrawn",
]);
export const platformFeeStatusEnum = pgEnum("platform_fee_status", [
  "pending",
  "paid",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 160 }),
  specialties: text("specialties").array().notNull().default([]),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  avatarHue: integer("avatar_hue").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    budgetMin: integer("budget_min").notNull(),
    budgetMax: integer("budget_max").notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    preferredDate: timestamp("preferred_date", {
      withTimezone: true,
    }).notNull(),
    status: jobStatusEnum("status").notNull().default("open"),
    awardedBidId: uuid("awarded_bid_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jobs_client_idx").on(table.clientId),
    index("jobs_status_category_idx").on(table.status, table.category),
  ],
);

export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    proId: uuid("pro_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    message: text("message").notNull(),
    status: bidStatusEnum("status").notNull().default("pending"),
    // Platform success fee (5% of amount), owed once the job this bid won
    // is marked completed. Null until the fee is created at that point.
    platformFeeAmount: integer("platform_fee_amount"),
    platformFeeStatus: platformFeeStatusEnum("platform_fee_status"),
    payfastPaymentId: text("payfast_payment_id"),
    platformFeePaidAt: timestamp("platform_fee_paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bids_job_idx").on(table.jobId),
    index("bids_pro_idx").on(table.proId),
    uniqueIndex("bids_job_pro_unique").on(table.jobId, table.proId),
  ],
);

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

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  bids: many(bids),
  sessions: many(sessions),
  photos: many(proPhotos),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, { fields: [jobs.clientId], references: [users.id] }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  job: one(jobs, { fields: [bids.jobId], references: [jobs.id] }),
  pro: one(users, { fields: [bids.proId], references: [users.id] }),
}));

export const proPhotosRelations = relations(proPhotos, ({ one }) => ({
  pro: one(users, { fields: [proPhotos.proId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type ProPhoto = typeof proPhotos.$inferSelect;
export type UserRole = User["role"];
export type JobStatus = Job["status"];
export type BidStatus = Bid["status"];
