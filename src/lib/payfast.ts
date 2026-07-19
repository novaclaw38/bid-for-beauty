import { createHash } from "node:crypto";
import { headers } from "next/headers";

const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";
const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate";
const LIVE_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";

const isLive = process.env.PAYFAST_MODE === "live";

export const PAYFAST_PROCESS_URL = isLive ? LIVE_PROCESS_URL : SANDBOX_PROCESS_URL;
const PAYFAST_VALIDATE_URL = isLive ? LIVE_VALIDATE_URL : SANDBOX_VALIDATE_URL;

export const PLATFORM_FEE_RATE = 0.05;

/** Whole-Rand fee for an awarded bid amount, rounded to the nearest Rand. */
export function calculatePlatformFee(bidAmount: number): number {
  return Math.round(bidAmount * PLATFORM_FEE_RATE);
}

/**
 * PHP's urlencode() — what PayFast's signature spec is defined against — is
 * stricter than JS encodeURIComponent: it also escapes ! * ' ( ) ~, which
 * encodeURIComponent leaves untouched. Left unfixed, any field containing
 * those characters (e.g. an item_description with parentheses) produces a
 * signature PayFast rejects as "does not match submitted signature".
 */
function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export function payfastSignature(fields: [string, string][]): string {
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  const pairs = fields.filter(([, v]) => v !== "" && v != null);
  let qs = pairs.map(([k, v]) => `${k}=${phpUrlEncode(v.trim())}`).join("&");
  if (passphrase) {
    qs += `&passphrase=${phpUrlEncode(passphrase.trim())}`;
  }
  return createHash("md5").update(qs).digest("hex");
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export interface PlatformFeeCheckout {
  fields: [string, string][];
  signature: string;
  processUrl: string;
}

/** Builds the full hidden-field set (in signature order) for a bid's platform fee checkout. */
export async function buildPlatformFeeCheckout(params: {
  bidId: string;
  jobId: string;
  feeAmount: number;
  proName: string;
  proEmail: string;
  jobTitle: string;
}): Promise<PlatformFeeCheckout> {
  const base = await getBaseUrl();
  const fields: [string, string][] = [
    ["merchant_id", process.env.PAYFAST_MERCHANT_ID ?? ""],
    ["merchant_key", process.env.PAYFAST_MERCHANT_KEY ?? ""],
    ["return_url", `${base}/dashboard/jobs/${params.jobId}?fee=submitted`],
    ["cancel_url", `${base}/dashboard/jobs/${params.jobId}?fee=cancelled`],
    ["notify_url", `${base}/api/payments/payfast/notify`],
    ["name_first", params.proName.split(" ")[0] ?? params.proName],
    ["email_address", params.proEmail],
    ["m_payment_id", params.bidId],
    ["amount", params.feeAmount.toFixed(2)],
    ["item_name", `Platform fee - ${params.jobTitle}`.slice(0, 100)],
    ["item_description", "Bid for Beauty success fee (5% of awarded bid)".slice(0, 255)],
    ["custom_str1", params.bidId],
  ];
  return { fields, signature: payfastSignature(fields), processUrl: PAYFAST_PROCESS_URL };
}

/**
 * PayFast ITN validation, per their integration guide: re-post the exact
 * received body to PayFast's validate endpoint and require the literal
 * response "VALID". This is the authoritative check — the signature check
 * alone only proves the payload wasn't tampered with in transit, not that
 * it actually came from PayFast.
 */
export async function validateWithPayfast(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text === "VALID";
  } catch {
    return false;
  }
}

// Published PayFast server ranges (see "Ports and IP addresses" in their docs).
// ITN requests should only ever originate from one of these.
const PAYFAST_IP_RANGES: [string, number][] = [
  ["197.97.145.144", 28],
  ["41.74.179.192", 27],
  ["102.216.36.0", 28],
  ["102.216.36.128", 28],
  ["144.126.193.139", 32],
];

function ipToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255))
    return null;
  return parts.reduce((acc, p) => acc * 256 + p, 0);
}

export function isPayfastIp(ip: string): boolean {
  const target = ipToInt(ip);
  if (target === null) return false;
  return PAYFAST_IP_RANGES.some(([base, bits]) => {
    const baseInt = ipToInt(base);
    if (baseInt === null) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (target & mask) === (baseInt & mask);
  });
}
