import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bids } from "@/db/schema";
import { isPayfastIp, payfastSignature, validateWithPayfast } from "@/lib/payfast";

/**
 * PayFast's server-to-server payment notification (ITN). This is the only
 * source of truth for marking a platform fee paid — the return_url the
 * buyer's browser hits is just UX and must never flip payment state itself.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  try {
    if (process.env.PAYFAST_MODE === "live") {
      const sourceIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      if (!sourceIp || !isPayfastIp(sourceIp)) {
        console.error("PayFast ITN: request from non-PayFast IP", sourceIp);
        return new Response("invalid source ip", { status: 400 });
      }
    }

    const received = new URLSearchParams(rawBody);
    const fields = [...received.entries()].filter(([k]) => k !== "signature");
    const expectedSignature = payfastSignature(fields);
    const signature = received.get("signature");
    if (!signature || signature !== expectedSignature) {
      console.error("PayFast ITN: signature mismatch");
      return new Response("invalid signature", { status: 400 });
    }

    const isValid = await validateWithPayfast(rawBody);
    if (!isValid) {
      console.error("PayFast ITN: source validation failed");
      return new Response("invalid source", { status: 400 });
    }

    const paymentStatus = received.get("payment_status");
    const mPaymentId = received.get("m_payment_id");
    const amountGross = received.get("amount_gross");
    if (paymentStatus !== "COMPLETE" || !mPaymentId) {
      return new Response("ok", { status: 200 });
    }

    const [bid] = await db.select().from(bids).where(eq(bids.id, mPaymentId)).limit(1);
    if (!bid || bid.platformFeeAmount === null) {
      console.error("PayFast ITN: unknown bid for m_payment_id", mPaymentId);
      return new Response("ok", { status: 200 });
    }

    if (Number(amountGross).toFixed(2) !== bid.platformFeeAmount.toFixed(2)) {
      console.error("PayFast ITN: amount mismatch for bid", mPaymentId);
      return new Response("ok", { status: 200 });
    }

    if (bid.platformFeeStatus !== "paid" && bid.platformFeeStatus !== "waived") {
      await db
        .update(bids)
        .set({
          platformFeeStatus: "paid",
          platformFeePaidAt: new Date(),
          payfastPaymentId: received.get("pf_payment_id"),
          updatedAt: new Date(),
        })
        .where(eq(bids.id, bid.id));
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("PayFast ITN error", err);
    return new Response("error", { status: 500 });
  }
}
