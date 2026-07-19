import type { Bid, Job, User } from "@/db/schema";
import type { ClientSummary, JobCardData, ProSummary, SessionUser } from "@/lib/types";
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
