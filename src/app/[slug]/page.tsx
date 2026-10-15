import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeoPage, seoPages } from "@/content/seo.de";
import { FaqList } from "@/features/cm/TrustSections";
import { TrackedLink } from "@/features/cm/Track";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return seoPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getSeoPage((await params).slug);
  if (!p) return {};
  return {
    title: p.metaTitle,
    description: p.description,
    alternates: { canonical: `/${p.slug}` },
    openGraph: { type: "article", title: `${p.metaTitle} | Concept Mining`, description: p.description, url: `/${p.slug}` },
  };
}

/** Knowledge article: direct answer → sections → FAQ → related → soft CTA. */
export default async function SeoArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getSeoPage((await params).slug);
  if (!p) notFound();
  const related = p.related.map(getSeoPage).filter((x) => x !== undefined);
  const crumbs = [{ name: "Startseite", path: "/" }, { name: "Wissen", path: "/wissen" }, { name: p.navLabel, path: `/${p.slug}` }];

  return (
    <article>
      <header data-tone="deep" className="ambient pt-[calc(var(--header-h)+3rem)] pb-14 md:pt-[calc(var(--header-h)+5rem)] md:pb-20">
        <div className="mx-auto max-w-[880px] px-5 md:px-10">
          <nav aria-label="Brotkrumen" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
            <ol className="flex flex-wrap gap-2">
              {crumbs.map((c, i) => (
                <li key={c.path} className="flex gap-2">
                  {i < crumbs.length - 1 ? <Link href={c.path} className="hover:text-ink">{c.name}</Link> : <span aria-current="page" className="text-eyebrow">{c.name}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="headline mt-8 text-headline">{p.h1}<span className="serif-em block">{p.h1Em}</span></h1>
          <p className="mt-8 rounded-[var(--radius-card)] border border-line bg-inset p-6 text-lead text-ink">{p.answer}</p>
          <p className="mt-4 text-xs text-ink-subtle">Aktualisiert am {formatDate(p.updated)} · Concept Mining</p>
        </div>
      </header>

      <div data-tone="paper" className="py-16 md:py-20">
        <div className="mx-auto max-w-[880px] space-y-12 px-5 md:px-10">
          {p.sections.map((s) => (
            <section key={s.h2}>
              <h2 className="headline text-title">{s.h2}</h2>
              <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink-muted">
                {s.body.map((b) => <p key={b}>{b}</p>)}
                {s.list && <ul className="space-y-2 pl-5 [&>li]:list-disc">{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
              </div>
            </section>
          ))}
          <section>
            <h2 className="headline text-title">Häufige Fragen</h2>
            <div className="mt-6"><FaqList items={p.faq.map((f, i) => ({ id: `${p.slug}-faq-${i}`, ...f }))} /></div>
          </section>
          {related.length > 0 && (
            <nav aria-label="Weiterlesen">
              <h2 className="eyebrow">Weiterlesen</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}><Link href={`/${r.slug}`} className="card block h-full p-5 font-semibold hover:brightness-[1.02]">{r.navLabel} →</Link></li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <div data-tone="dark" className="py-16">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="font-serif text-title">Wie sieht das für Ihren Betrag aus?</p>
          <TrackedLink href="/#simulation" event={{ name: "model_cta_clicked", placement: `article:${p.slug}` }}>Investment berechnen</TrackedLink>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript([
        articleJsonLd({ headline: p.metaTitle, description: p.description, path: `/${p.slug}`, dateModified: p.updated }),
        breadcrumbJsonLd(crumbs),
        faqJsonLd(p.faq),
      ]) }} />
    </article>
  );
}
