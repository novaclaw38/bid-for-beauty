import type { BidStatus, JobStatus, UserRole } from "@/db/schema";

/** Serialized shapes passed from server pages to client components. */

export interface ProSummary {
  id: string;
  name: string;
  avatarHue: number;
  location: string | null;
  rating: string | null;
  jobsCompleted: number;
  specialties: string[];
  photos: string[];
}

export interface ClientSummary {
  id: string;
  name: string;
  avatarHue: number;
  location: string | null;
}

export interface JobCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  preferredDate: string | null;
  status: JobStatus;
  createdAt: string;
  createdAgo: string;
  bidCount: number;
  client: ClientSummary;
  myBid?: { id: string; amount: number; status: BidStatus } | null;
}

export interface BidWithPro {
  id: string;
  amount: number;
  message: string;
  status: BidStatus;
  createdAt: string;
  createdAgo: string;
  pro: ProSummary;
}

export interface MyBidRow {
  id: string;
  amount: number;
  message: string;
  status: BidStatus;
  createdAt: string;
  createdAgo: string;
  job: {
    id: string;
    title: string;
    category: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    status: JobStatus;
    preferredDate: string | null;
    clientName: string;
  };
}

export interface SessionUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  bio: string | null;
  location: string | null;
  specialties: string[];
  rating: string | null;
  jobsCompleted: number;
  avatarHue: number;
}
