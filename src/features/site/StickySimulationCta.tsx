"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "@/components/ui/Icons";
import { track } from "@/lib/analytics";

/**
 * Mobile-only bar after the hero. Hidden while the simulation or the
 * consultation form is on screen, so it never covers the thing it points to.
 */
export function StickySimulationCta() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const targets = ["simulation", "beratung"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const inView = new Set<Element>();
    let pastHero = false;
    const update = () => setVisible(pastHero && inView.size === 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? inView.add(e.target) : inView.delete(e.target);
      update();
    });
    targets.forEach((t) => io.observe(t));
    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.8;
      update();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div data-tone="dark" aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-3 z-40 rounded-pill border border-line-strong bg-[#0e1013]/90 p-1.5 shadow-[0_16px_40px_rgb(0_0_0/0.35)] backdrop-blur-xl transition-all duration-300 md:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
      <Link href="#simulation" tabIndex={visible ? 0 : -1} onClick={() => track({ name: "model_cta_clicked", placement: "sticky" })} className="flex min-h-12 items-center justify-between gap-3 rounded-pill bg-accent pl-5 pr-4 text-sm font-bold text-accent-ink">
        Investment berechnen <ArrowRight />
      </Link>
    </div>
  );
}
