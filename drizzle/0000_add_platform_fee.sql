CREATE TYPE "public"."platform_fee_status" AS ENUM('pending', 'paid');--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "platform_fee_amount" integer;--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "platform_fee_status" "platform_fee_status";--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "payfast_payment_id" text;--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "platform_fee_paid_at" timestamp with time zone;
