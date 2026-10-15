"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getLeadSink } from "@/server/leads/lead-sink";
import { createMemoryRateLimiter } from "@/server/leads/rate-limit";
import type { ConsultationResult } from "./schema";
import { consultationSchema, MIN_FILL_MS } from "./schema";

const limiter = createMemoryRateLimiter(5, 60 * 60 * 1000);

export async function submitConsultation(_prev: ConsultationResult | null, form: FormData): Promise<ConsultationResult> {
  const parsed = consultationSchema.safeParse({
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    interest: form.get("interest"),
    preferredAmount: form.get("preferredAmount") ?? "",
    simulatedAmount: form.get("simulatedAmount") ?? "",
    scenarioId: form.get("scenarioId") ?? "",
    consent: form.get("consent") === "on",
    website: form.get("website") ?? "",
    startedAt: form.get("startedAt"),
  });

  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: false, reason: "SPAM" };
    return { ok: false, reason: "INVALID", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  if (Date.now() - parsed.data.startedAt < MIN_FILL_MS) return { ok: false, reason: "SPAM" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Only a hash of the IP is used as rate-limit key; it is never stored or logged.
  if (!limiter.allow(createHash("sha256").update(ip).digest("hex"))) return { ok: false, reason: "RATE_LIMITED" };

  const sink = getLeadSink();
  if (!sink.configured) return { ok: false, reason: "NOT_CONFIGURED" };
  const { website: _w, startedAt: _s, ...lead } = parsed.data;
  const delivered = await sink.deliver(lead);
  return delivered.ok ? { ok: true } : { ok: false, reason: "DELIVERY_FAILED" };
}
