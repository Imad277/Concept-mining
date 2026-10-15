"use client";

import { useActionState, useEffect, useState } from "react";
import { getScenario } from "@/config";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { track } from "@/lib/analytics";
import { formatEur } from "@/lib/format";
import { useSimulationChoice } from "../simulation/SimulationState";
import { submitConsultation } from "./actions";
import type { ConsultationResult } from "./schema";
import { INTEREST_LABEL, INTERESTS } from "./schema";

const MESSAGES: Record<Exclude<ConsultationResult, { ok: true }>["reason"], string> = {
  INVALID: "Bitte prüfen Sie die markierten Angaben.",
  SPAM: "Die Anfrage konnte nicht verarbeitet werden.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
  NOT_CONFIGURED: "Das Anfrageformular ist noch nicht freigeschaltet. Bitte schreiben Sie uns an main@lindenconcept.com.",
  DELIVERY_FAILED: "Die Anfrage konnte nicht zugestellt werden. Bitte versuchen Sie es später erneut.",
};

const field = "min-h-12 w-full rounded-[14px] border border-line-strong bg-inset px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent-line aria-[invalid=true]:border-negative";

function Field({ label, error, children, className }: { label: string; error?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm text-ink-muted", className)}>
      {label}
      {children}
      {error && <span className="text-xs text-negative">Bitte prüfen.</span>}
    </label>
  );
}

/**
 * Lead form. Prefilled with the visitor's simulated amount and scenario once
 * they used the simulator. Works without JS (server action).
 */
export function ConsultationForm() {
  const [state, action, pending] = useActionState(submitConsultation, null);
  const { amount, scenarioId, touched } = useSimulationChoice();
  const [startedAt, setStartedAt] = useState(0);
  const [began, setBegan] = useState(false);
  useEffect(() => setStartedAt(Date.now()), []);
  useEffect(() => {
    if (state?.ok) track({ name: "consultation_submitted", interest: "submitted" });
  }, [state]);

  if (state?.ok)
    return (
      <div role="status" className="rounded-[18px] bg-inset-strong p-6">
        <p className="font-serif text-card">Vielen Dank.</p>
        <p className="mt-2 text-ink-muted">Wir melden uns zur Terminabstimmung. Bis dahin entstehen keinerlei Verpflichtungen.</p>
      </div>
    );
  const errors = state && !state.ok && state.reason === "INVALID" ? state.fieldErrors : {};

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate
      onFocus={() => { if (!began) { setBegan(true); track({ name: "consultation_started", placement: "form" }); } }}>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="simulatedAmount" value={touched ? amount / 100 : ""} />
      <input type="hidden" name="scenarioId" value={touched ? scenarioId : ""} />
      <div className="absolute left-[-9999px]" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>

      {touched && (
        <p className="rounded-[14px] border border-accent-line bg-inset px-4 py-3 text-sm sm:col-span-2">
          Ihre Simulation wird mitgesendet: <span className="tabular font-semibold">{formatEur(amount)}</span> · Szenario {getScenario(scenarioId).name}
        </p>
      )}
      <Field label="Vorname" error={!!errors.firstName}><input name="firstName" required autoComplete="given-name" className={field} aria-invalid={!!errors.firstName} /></Field>
      <Field label="Nachname" error={!!errors.lastName}><input name="lastName" required autoComplete="family-name" className={field} aria-invalid={!!errors.lastName} /></Field>
      <Field label="E-Mail" error={!!errors.email}><input name="email" type="email" required autoComplete="email" className={field} aria-invalid={!!errors.email} /></Field>
      <Field label="Telefon (optional)" error={!!errors.phone}><input name="phone" type="tel" autoComplete="tel" className={field} aria-invalid={!!errors.phone} /></Field>
      <Field label="Investmentinteresse">
        <select name="interest" className={field} defaultValue="mining-capacity">
          {INTERESTS.map((i) => <option key={i} value={i} className="text-[#15171a]">{INTEREST_LABEL[i]}</option>)}
        </select>
      </Field>
      <Field label="Bevorzugter Betrag in € (optional)" error={!!errors.preferredAmount}>
        <input key={touched ? amount : "x"} name="preferredAmount" inputMode="numeric" pattern="[0-9]*" className={field} defaultValue={touched ? String(amount / 100) : ""} placeholder="z. B. 10000" aria-invalid={!!errors.preferredAmount} />
      </Field>
      <label className="flex items-start gap-3 text-sm text-ink-muted sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
        <span>Ich bin einverstanden, dass meine Angaben zur Kontaktaufnahme verarbeitet werden (siehe <a href="/datenschutz" className="underline underline-offset-2">Datenschutzerklärung</a>). Die Einwilligung kann ich jederzeit widerrufen.</span>
      </label>
      {state && !state.ok && <p role="alert" className="text-sm text-negative sm:col-span-2">{MESSAGES[state.reason]}</p>}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" icon="right" disabled={pending}>{pending ? "Wird gesendet …" : "Investmentgespräch anfragen"}</Button>
        <p className="text-xs text-ink-subtle">Unverbindlich · kein Konto · keine Zahlungsdaten</p>
      </div>
    </form>
  );
}
