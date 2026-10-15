/**
 * Privacy-first analytics. Typed events, no PII, exact amounts never leave
 * the browser (only coarse buckets). Nothing is sent before consent: the sink
 * is a no-op until a consent-aware provider calls `setAnalyticsSink` AND
 * `setAnalyticsConsent(true)` has been called by the consent layer.
 */
export type AnalyticsEvent =
  | { name: "hero_cta_clicked"; cta: "calculate" | "how_it_works" }
  | { name: "model_cta_clicked"; placement: string }
  | { name: "calculator_started" }
  | { name: "investment_amount_selected"; amountBucket: string }
  | { name: "scenario_viewed"; scenarioId: string }
  | { name: "advanced_assumptions_opened"; placement: string }
  | { name: "calculator_completed"; status: "COMPLETE" | "PROVISIONAL" | "BLOCKED"; scenarioId: string; amountBucket: string }
  | { name: "consultation_started"; placement: string }
  | { name: "consultation_submitted"; interest: string };

export interface AnalyticsSink {
  track(event: AnalyticsEvent): void;
}

let sink: AnalyticsSink = { track: () => {} };
let consent = false;

export function setAnalyticsSink(next: AnalyticsSink): void {
  sink = next;
}

/** Set by the consent banner/CMP. Without consent, no event is forwarded. */
export function setAnalyticsConsent(granted: boolean): void {
  consent = granted;
}

export function track(event: AnalyticsEvent): void {
  if (!consent) return;
  try {
    sink.track(event);
  } catch {
    // Analytics must never break the product.
  }
}

/** Coarse buckets so exact amounts are never sent. */
export function amountBucket(cents: number): string {
  const eur = cents / 100;
  if (eur < 10_000) return "5k-10k";
  if (eur < 25_000) return "10k-25k";
  if (eur < 50_000) return "25k-50k";
  return "50k";
}
