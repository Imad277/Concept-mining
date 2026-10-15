"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { Claim } from "@/components/ui/Claim";
import { model } from "@/content/site.de";
import { useInView } from "../simulation/useTween";
import type { StationId } from "./StationIcons";
import { StationIcon } from "./StationIcons";
import { TrackedLink } from "./Track";

/**
 * 01 · Das Modell – "Von Energie zu Bitcoin". Five stations; the active one
 * advances slowly while in view until the visitor picks one themselves.
 */
export function ModelChain() {
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView || manual || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % model.stations.length), 4_200);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [inView, manual]);

  const s = model.stations[active]!;
  const Icon = StationIcon[s.id as StationId];
  const pick = (i: number) => { setManual(true); setActive(i); };

  return (
    <div ref={ref}>
      <div className="card rounded-[var(--radius-panel)] p-5 md:p-9">
        {/* chain */}
        <div className="relative">
          <div aria-hidden className="absolute left-[10%] right-[10%] top-[27px] hidden h-px bg-line-strong md:block" />
          <div aria-hidden className="absolute left-[10%] top-[27px] hidden h-px bg-gradient-to-r from-data-solar via-em to-data-btc transition-[width] duration-700 ease-[var(--ease-standard)] md:block"
            style={{ width: `${(active / (model.stations.length - 1)) * 80}%` }} />
          <div role="tablist" aria-label="Stationen der Wertschöpfungskette" className="relative grid grid-cols-5 gap-1 md:gap-4">
            {model.stations.map((st, i) => {
              const I = StationIcon[st.id as StationId];
              const on = i === active;
              const done = i < active;
              return (
                <button key={st.id} type="button" role="tab" aria-selected={on} aria-controls="model-panel" id={`model-tab-${st.id}`}
                  onClick={() => pick(i)} onMouseEnter={() => manual && setActive(i)}
                  className="group flex flex-col items-center gap-3 rounded-[16px] py-1 text-center">
                  <span className={cn("relative flex size-12 items-center md:size-14 justify-center rounded-full border backdrop-blur transition-all duration-500",
                    on ? "border-accent-line bg-accent text-accent-ink shadow-[0_0_0_6px_rgb(220_199_163/0.12)]" : done ? "border-accent-line bg-bg text-em" : "border-line-strong bg-bg text-ink-muted group-hover:text-ink")}>
                    <I className="size-6" />
                  </span>
                  <span className={cn("sr-only text-sm font-semibold leading-tight md:not-sr-only", on ? "text-ink" : "text-ink-subtle")}>{st.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="model-panel" role="tabpanel" aria-labelledby={`model-tab-${s.id}`} aria-live="polite"
          className="mt-8 grid items-center gap-6 rounded-[22px] bg-inset p-5 md:mt-10 md:grid-cols-[auto_minmax(0,1fr)] md:p-7">
          <span className="hidden size-16 items-center justify-center rounded-[18px] border border-accent-line text-em md:flex"><Icon className="size-8" /></span>
          <div key={s.id} className="cm-rise">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-eyebrow">{String(active + 1).padStart(2, "0")} / {String(model.stations.length).padStart(2, "0")}</p>
            <p className="mt-2 font-serif text-card">{s.title}</p>
            <p className="mt-2 max-w-2xl text-ink-muted">{s.text}</p>
          </div>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-3">
        {model.summary.map((x, i) => (
          <div key={x.q} className="rounded-[var(--radius-card)] border border-line p-6">
            <dt className="eyebrow !text-ink-subtle">{x.q}</dt>
            <dd className="mt-3 text-[17px] leading-snug">
              {i === 2 ? <Claim id="capacityAllocationEntitlement" inline>{x.a}</Claim> : x.a}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">
        <TrackedLink href="#kapazitaet" variant="outline" icon="down" event={{ name: "model_cta_clicked", placement: "model" }}>{model.cta}</TrackedLink>
      </div>
    </div>
  );
}
