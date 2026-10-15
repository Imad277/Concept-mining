import { z } from "zod";

export const INTERESTS = ["mining-capacity", "general", "undecided"] as const;
export const INTEREST_LABEL: Record<(typeof INTERESTS)[number], string> = {
  "mining-capacity": "Mining-Kapazität",
  general: "Allgemeine Information",
  undecided: "Noch offen",
};

/** Minimum time between form render and submit; faster submissions are bots. */
export const MIN_FILL_MS = 3_000;

const optionalEur = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(10_000_000)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/**
 * Consultation lead. Contact data only — no financial documents, IDs or bank
 * data. Validated on the server; the client only pre-fills. The simulated
 * amount and scenario are context for the conversation, not an order.
 */
export const consultationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: z.string().trim().max(40).regex(/^[+0-9 ()/-]*$/).optional().or(z.literal("")),
  interest: z.enum(INTERESTS),
  /** Optional preferred amount in EUR (whole euros). */
  preferredAmount: optionalEur,
  /** Amount and scenario of the visitor's simulation (EUR), if any. */
  simulatedAmount: optionalEur,
  scenarioId: z.string().trim().max(40).regex(/^[a-z-]*$/).optional().or(z.literal("")),
  consent: z.literal(true),
  /** Honeypot: hidden field, must stay empty. */
  website: z.string().max(0),
  /** Epoch ms when the form was rendered. */
  startedAt: z.coerce.number().int().positive(),
});

export type ConsultationLead = Omit<z.infer<typeof consultationSchema>, "website" | "startedAt">;

export type ConsultationResult =
  | { ok: true }
  | { ok: false; reason: "INVALID"; fieldErrors: Record<string, string[]> }
  | { ok: false; reason: "SPAM" | "RATE_LIMITED" | "NOT_CONFIGURED" | "DELIVERY_FAILED" };
