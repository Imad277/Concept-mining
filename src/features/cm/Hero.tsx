import { hero } from "@/content/site.de";
import { HeroVisual } from "./HeroVisual";
import { TrackedLink } from "./Track";

/** 00 · Hero – proposition first, no returns. */
export function Hero() {
  return (
    <section data-tone="deep" aria-labelledby="hero-title" className="ambient relative overflow-hidden pt-[calc(var(--header-h)+2.5rem)] pb-16 md:pt-[calc(var(--header-h)+4rem)] md:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-6">
        <div className="cm-rise">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 id="hero-title" className="headline mt-6 text-display">
            {hero.lines.map((l) => <span key={l} className="metal block pb-[0.06em]">{l}</span>)}
            <span className="serif-em block">{hero.em}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lead text-ink-muted">{hero.lead}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TrackedLink href="#simulation" event={{ name: "hero_cta_clicked", cta: "calculate" }}>{hero.primaryCta}</TrackedLink>
            <TrackedLink href="#modell" variant="outline" icon="down" event={{ name: "hero_cta_clicked", cta: "how_it_works" }}>{hero.secondaryCta}</TrackedLink>
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">{hero.micro}</p>
        </div>
        <div className="relative -mx-5 sm:mx-0">
          <HeroVisual caption={hero.visualCaption} />
        </div>
      </div>
    </section>
  );
}
