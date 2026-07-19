import type { AdminAction, Bid, Job, User } from "@/db/schema";
import type {
  AdminActionRow,
  AdminFeeRow,
  AdminJobRow,
  AdminUserRow,
  ClientSummary,
  JobCardData,
  ProSummary,
  SessionUser,
} from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    bio: user.bio,
    location: user.location,
    specialties: user.specialties,
    rating: user.rating,
    jobsCompleted: user.jobsCompleted,
    avatarHue: user.avatarHue,
  };
}

export function toClientSummary(user: User): ClientSummary {
  return {
    id: user.id,
    name: user.name,
    avatarHue: user.avatarHue,
    location: user.location,
  };
}

export function toProSummary(user: User, photos: string[] = []): ProSummary {
  return {
    id: user.id,
    name: user.name,
    avatarHue: user.avatarHue,
    location: user.location,
    rating: user.rating,
    jobsCompleted: user.jobsCompleted,
    specialties: user.specialties,
    photos,
  };
}

export function toJobCardData(
  job: Job,
  client: User,
  bidCount: number,
  myBid?: Pick<Bid, "id" | "amount" | "status"> | null,
): JobCardData {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    budgetMin: job.budgetMin,
    budgetMax: job.budgetMax,
    location: job.location,
    preferredDate: job.preferredDate?.toISOString() ?? null,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    createdAgo: timeAgo(job.createdAt),
    bidCount,
    client: toClientSummary(client),
    myBid: myBid ?? null,
  };
}

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
