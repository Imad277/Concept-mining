import Link from "next/link";
import { company as companyData } from "@/config";
import { Plus } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Wordmark";
import type { FaqItem } from "@/content/faq.de";
import { company, finalCta, transparency } from "@/content/site.de";
import { ConsultationForm } from "../consultation/ConsultationForm";
import { TrackedLink } from "./Track";

/** 10 · Transparenz – what Concept Mining controls vs. what the market decides. */
export function Transparency() {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="card p-6 md:p-8">
          <p className="eyebrow">{transparency.controlTitle}</p>
          <ul className="mt-5 grid grid-cols-2 gap-2">
            {transparency.control.map((c) => (
              <li key={c} className="flex items-center gap-2.5 rounded-[12px] bg-inset px-3 py-3 text-sm font-semibold">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-positive" />{c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-6 md:p-8">
          <p className="eyebrow !text-ink-subtle">{transparency.marketTitle}</p>
          <ul className="mt-5 space-y-2">
            {transparency.market.map((c) => (
              <li key={c} className="flex items-center gap-2.5 rounded-[12px] border border-line px-3 py-3 text-sm font-semibold text-ink-muted">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-data-btc" />{c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <p className="font-serif text-card">Risiken, offen benannt.</p>
        <div>
          <ul className="space-y-3">
            {transparency.risks.map((r) => (
              <li key={r} className="flex gap-3 border-b border-line pb-3 text-ink-muted"><span aria-hidden className="text-em">—</span>{r}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <TrackedLink href="#beratung" variant="outline" event={{ name: "consultation_started", placement: "transparency" }}>{transparency.cta}</TrackedLink>
            <Link href="/risikohinweise" className="border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">Alle Risikohinweise</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 11 · Concept Mining & Linden Concept – verified business facts only. */
export function CompanyBlock() {
  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="card flex aspect-[4/3] items-center justify-center rounded-[var(--radius-panel)]">
        <div className="text-center">
          <LogoMark className="mx-auto size-24" />
          <p className="mt-5 font-serif text-3xl uppercase tracking-[0.07em]">Concept <span className="text-gold-500">Mining</span></p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-subtle">eine Marke der {companyData.legalName}</p>
        </div>
      </div>
      <div className="space-y-5 text-lead text-ink-muted">
        {company.text.map((t) => <p key={t}>{t}</p>)}
        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
          <div><dt className="text-ink-subtle">Sitz</dt><dd className="font-semibold text-ink">{companyData.city}</dd></div>
          <div><dt className="text-ink-subtle">Handelsregister</dt><dd className="font-semibold text-ink">{companyData.registerNumber}, {companyData.registerCourt}</dd></div>
          <div><dt className="text-ink-subtle">Geschäftsführer</dt><dd className="font-semibold text-ink">{companyData.managingDirector}</dd></div>
          <div><dt className="text-ink-subtle">Kontakt</dt><dd className="font-semibold text-ink"><a href={`mailto:${companyData.email}`} className="hover:underline">{companyData.email}</a></dd></div>
        </dl>
      </div>
    </div>
  );
}

/** 12 · Final conversion – steps + lead form (prefilled from the simulation). */
export function FinalConversion() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <ol className="space-y-3">
        {finalCta.steps.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-[var(--radius-card)] border border-line p-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-line font-mono text-[11px] text-em">{i + 1}</span>
            <div><p className="font-semibold">{s.title}</p><p className="text-sm text-ink-muted">{s.text}</p></div>
          </li>
        ))}
        <li className="px-1 pt-2 text-sm text-ink-subtle">{finalCta.note}</li>
      </ol>
      <div className="card rounded-[var(--radius-panel)] p-6 md:p-9">
        <h3 className="font-serif text-title">{finalCta.formTitle}</h3>
        <div className="mt-6"><ConsultationForm /></div>
      </div>
    </div>
  );
}

/** FAQ – visible text equals FAQPage JSON-LD. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-line">
      {items.map((f) => (
        <details key={f.id} id={f.id} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            <h3>{f.question}</h3>
            <Plus className="size-5 shrink-0 text-em transition-transform duration-200 group-open:rotate-45" />
          </summary>
          <p className="max-w-2xl pb-6 text-ink-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
