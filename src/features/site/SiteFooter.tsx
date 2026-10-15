import Link from "next/link";
import { company } from "@/config";
import { Wordmark } from "@/components/ui/Wordmark";
import { seoPages } from "@/content/seo.de";

export function SiteFooter() {
  return (
    <footer data-tone="deep" className="border-t border-line py-16 text-sm">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Wordmark />
          <p className="mt-5 max-w-xs font-serif text-2xl leading-snug text-ink">Professionelle Bitcoin-Mining-Infrastruktur.</p>
          <p className="mt-4 text-ink-muted">{company.brandLine}</p>
          <a href={`mailto:${company.email}`} className="mt-3 block text-ink-muted hover:text-ink">{company.email}</a>
        </div>
        <nav aria-label="Concept Mining">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-eyebrow">Concept Mining</h2>
          <ul className="mt-4 space-y-2.5 text-ink-muted">
            <li><Link href="/#modell" className="hover:text-ink">Das Modell</Link></li>
            <li><Link href="/#infrastruktur" className="hover:text-ink">Infrastruktur</Link></li>
            <li><Link href="/#energie" className="hover:text-ink">Energie</Link></li>
            <li><Link href="/#simulation" className="hover:text-ink">Investment-Simulation</Link></li>
            <li><Link href="/simulation" className="hover:text-ink">Vollständige Simulation</Link></li>
            <li><Link href="/methodik" className="hover:text-ink">Methodik</Link></li>
          </ul>
        </nav>
        <nav aria-label="Wissen">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-eyebrow">Wissen</h2>
          <ul className="mt-4 space-y-2.5 text-ink-muted">
            {seoPages.slice(0, 6).map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className="hover:text-ink">{p.navLabel}</Link></li>)}
            <li><Link href="/wissen" className="hover:text-ink">Alle Artikel</Link></li>
          </ul>
        </nav>
        <nav aria-label="Rechtliches">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-eyebrow">Rechtliches</h2>
          <ul className="mt-4 space-y-2.5 text-ink-muted">
            <li><Link href="/impressum" className="hover:text-ink">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link></li>
            <li><Link href="/risikohinweise" className="hover:text-ink">Risikohinweise</Link></li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-14 max-w-[1240px] border-t border-line px-5 pt-6 text-xs leading-relaxed text-ink-subtle md:px-10">
        <p>© {new Date().getFullYear()} {company.legalName}. Werbliche Information. Alle Ergebnisse sind Modellrechnungen, keine Prognosen und keine Zusagen. Ein Verlust des eingesetzten Kapitals ist möglich.</p>
      </div>
    </footer>
  );
}
