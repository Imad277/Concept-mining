import "server-only";
import type { ConsultationLead } from "@/features/consultation/schema";

/**
 * Where consultation leads go (e-mail, CRM, later Linden Depot). Not decided
 * yet, so the default sink REFUSES instead of silently dropping leads.
 */
export interface LeadSink {
  deliver(lead: ConsultationLead): Promise<{ ok: boolean }>;
}

export const notConfiguredLeadSink: LeadSink & { configured: false } = {
  configured: false,
  async deliver() {
    return { ok: false };
  },
};

export function getLeadSink(): LeadSink & { configured: boolean } {
  return notConfiguredLeadSink;
}
