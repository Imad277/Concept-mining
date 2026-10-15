"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Close, Menu } from "@/components/ui/Icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { nav } from "@/content/site.de";
import { track } from "@/lib/analytics";

/** Fixed header: wordmark · anchors · CTA pill. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header data-tone="dark" className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled || open ? "border-line bg-[#0e1013]/80 backdrop-blur-xl" : "border-transparent !bg-transparent"}`}>
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1240px] items-center justify-between gap-6 px-5 md:px-10">
        <Link href="/" aria-label="Concept Mining – Startseite" className="text-ink" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <nav aria-label="Hauptnavigation" className="hidden xl:block">
          <ul className="flex items-center gap-1 whitespace-nowrap text-[13px] font-medium">
            {nav.map((n) => (
              <li key={n.href}><Link href={n.href} className="rounded-[10px] px-3 py-2 text-ink/90 hover:text-ink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/#simulation" onClick={() => track({ name: "model_cta_clicked", placement: "header" })}
            className="hidden min-h-10 items-center gap-2 whitespace-nowrap rounded-pill border border-accent-line px-4 text-xs font-bold text-gold-300 hover:bg-inset-strong sm:inline-flex">
            Investment berechnen <ArrowUpRight className="size-3.5" />
          </Link>
          <button type="button" className="inline-flex size-11 items-center justify-center rounded-pill border border-line-strong xl:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Menü schließen" : "Menü öffnen"} onClick={() => setOpen((v) => !v)}>
            {open ? <Close className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile Navigation" className="h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-line px-5 pb-10 xl:hidden">
          <ul className="divide-y divide-line">
            {nav.map((n, i) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-5">
                  <span className="font-mono text-[11px] text-eyebrow">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-3xl">{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/#simulation" onClick={() => { setOpen(false); track({ name: "model_cta_clicked", placement: "mobile_nav" }); }} className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-pill bg-accent font-bold text-accent-ink">
            Investment berechnen
          </Link>
        </nav>
      )}
    </header>
  );
}
