import type { Metadata } from "next";
import { company } from "@/config";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Impressum", alternates: { canonical: "/impressum" }, robots: { index: true, follow: true } };

/** Impressum – company data exactly as supplied. Group information is kept separate from the mining model. */
export default function ImpressumPage() {
  const s = company.subsidiary;
  return (
    <>
      <div data-tone="deep" className="h-[var(--header-h)]" />
      <Section tone="paper" label="Rechtliches" title="Impressum" size="md">
        <div className="grid max-w-4xl gap-12 md:grid-cols-2">
          <div className="space-y-6 text-[17px] leading-relaxed">
            <div>
              <h2 className="eyebrow">Angaben gemäß § 5 DDG</h2>
              <p className="mt-3">
                {company.legalName}<br />
                {company.street}<br />
                {company.postalCode} {company.city}
              </p>
            </div>
            <div>
              <h2 className="eyebrow">Handelsregister</h2>
              <p className="mt-3">Handelsregister: {company.registerNumber}<br />Registergericht: {company.registerCourt}</p>
            </div>
            <div>
              <h2 className="eyebrow">Vertreten durch</h2>
              <p className="mt-3">Vertreten durch den Geschäftsführer: {company.managingDirector}</p>
            </div>
            <div>
              <h2 className="eyebrow">Kontakt</h2>
              <p className="mt-3">E-Mail: <a href={`mailto:${company.email}`} className="underline underline-offset-2">{company.email}</a></p>
            </div>
            <p className="text-ink-muted">{company.brandLine}</p>
          </div>

          <aside className="rounded-[var(--radius-card)] border border-line p-6 text-sm leading-relaxed text-ink-muted">
            <h2 className="eyebrow">Gruppeninformation</h2>
            <p className="mt-3">{s.statement}</p>
            <dl className="tabular mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt>Wertpapierkennnummer</dt><dd className="font-semibold text-ink">{s.wkn}</dd>
              <dt>ISIN</dt><dd className="font-semibold text-ink">{s.isin}</dd>
              <dt>LEI</dt><dd className="font-semibold text-ink">{s.lei}</dd>
            </dl>
            <p className="mt-4">{s.disclaimer}</p>
            <p className="mt-4 border-t border-line pt-4 text-xs text-ink-subtle">
              Diese Angaben betreffen ausschließlich die genannte Gesellschaft und ihre Schuldverschreibungen. Sie beschreiben weder Concept Mining noch das auf dieser Website dargestellte Mining-Kapazitätsmodell oder das AI Treasury.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
