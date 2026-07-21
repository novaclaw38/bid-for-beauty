import { BadgeCheck, CircleDollarSign } from "lucide-react";
import { buildPlatformFeeCheckout } from "@/lib/payfast";
import { formatCurrency } from "@/lib/utils";

export async function PlatformFeeCard({
  bidId,
  jobId,
  jobTitle,
  feeAmount,
  feeStatus,
  proName,
  proEmail,
}: {
  bidId: string;
  jobId: string;
  jobTitle: string;
  feeAmount: number;
  feeStatus: "pending" | "paid" | "waived";
  proName: string;
  proEmail: string;
}) {
  if (feeStatus === "paid" || feeStatus === "waived") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-soft p-4">
        <BadgeCheck className="size-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-success">
            {feeStatus === "paid" ? "Platform fee paid" : "Platform fee waived"}
          </p>
          <p className="mt-0.5 text-xs text-success/80">
            {feeStatus === "paid"
              ? `${formatCurrency(feeAmount)} settled for this job.`
              : "No payment needed for this job."}
          </p>
        </div>
      </div>
    );
  }

  const { fields, signature, processUrl } = await buildPlatformFeeCheckout({
    bidId,
    jobId,
    feeAmount,
    proName,
    proEmail,
    jobTitle,
  });

  return (
    <div className="rounded-2xl border border-warning/25 bg-warning-soft p-5">
      <div className="flex items-start gap-3">
        <CircleDollarSign className="size-5 shrink-0 text-warning-ink" />
        <div>
          <p className="text-sm font-semibold text-warning-ink">
            Platform fee due: {formatCurrency(feeAmount)}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-warning-ink/80">
            5% success fee for winning this job, payable once. Settled via PayFast.
          </p>
        </div>
      </div>
      <form action={processUrl} method="POST" className="mt-4">
        {fields.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="signature" value={signature} />
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-cream transition-colors hover:bg-night-2"
        >
          Pay {formatCurrency(feeAmount)} with PayFast
        </button>
      </form>
    </div>
  );
}
