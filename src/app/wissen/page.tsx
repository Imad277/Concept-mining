import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { faq } from "@/content/faq.de";
import { seoPages } from "@/content/seo.de";
import { FaqList } from "@/features/cm/TrustSections";
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Wissen: Bitcoin Mining verständlich erklärt",
  description: "Bitcoin Mining, Hashrate, Hashprice, Kosten, Solarenergie und Profitabilität – verständlich erklärt von Concept Mining.",
  alternates: { canonical: "/wissen" },
};

export default function WissenPage() {
  return (
    <>
      <div data-tone="deep" className="h-[var(--header-h)]" />
      <Section tone="deep" className="ambient" label="Wissen" title="Bitcoin Mining," titleEm="verständlich erklärt." size="md"
        intro={<p>Was Mining ist, wie Rechenleistung gemessen wird, wovon der Ertrag abhängt und welche Kosten entstehen – ohne Fachjargon und ohne Versprechen.</p>}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seoPages.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} className="card flex h-full flex-col p-6 transition-[filter] hover:brightness-110">
                <span className="font-mono text-[11px] tracking-[0.15em] text-eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-4 font-serif text-2xl leading-tight">{p.navLabel}</span>
                <span className="mt-3 text-sm text-ink-muted">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="faq" tone="paper" label="Häufige Fragen" title="Kurz beantwortet." layout="split" size="md">
        <FaqList items={faq} />
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript([faqJsonLd(faq), breadcrumbJsonLd([{ name: "Startseite", path: "/" }, { name: "Wissen", path: "/wissen" }])]) }} />
    </>
  );
}
