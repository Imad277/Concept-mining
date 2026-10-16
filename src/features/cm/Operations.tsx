import { operations } from "@/content/site.de";
import { RuleFlow } from "./RuleFlow";

const ICONS = [
  "M8.5 11.3V4.5a1.5 1.5 0 0 1 3 0v6.8a3 3 0 1 1-3 0zM10 8v5", // temperature
  "M11 2 5 11h5l-1 7 6-9h-5l1-7z", // power
  "M3 10h3l2-5 4 10 2-5h3", // availability
  "M10 3v14M3.5 6.5l13 7M16.5 6.5l-13 7", // cooling
  "M14.5 3.5a3.5 3.5 0 0 0-4.6 4.4L3.5 14.3l2.2 2.2 6.4-6.4a3.5 3.5 0 0 0 4.4-4.6l-2 2-2-2 2-2z", // maintenance
  "M10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 2v2M10 16v2M2 10h2M16 10h2", // energy
];

/** 06 · Operative Intelligenz – Regelwerk für mehr Bitcoin je kWh und der Betrieb dahinter. */
export function Operations() {
  return (
    <div className="space-y-10">
      <RuleFlow />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {operations.steps.map((st, i) => (
          <li key={st.title} className="rounded-[var(--radius-card)] border border-line p-6">
            <p className="font-mono text-[11px] tracking-[0.15em] text-eyebrow">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-3 font-serif text-card">{st.title}</p>
            <p className="mt-2 text-sm text-ink-muted">{st.text}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <p className="font-serif text-card">{operations.rulesTitle}</p>
        <ul className="divide-y divide-line border-y border-line">
          {operations.rules.map((r) => (
            <li key={r.title} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] sm:gap-6">
              <span className="font-semibold">{r.title}</span>
              <span className="text-ink-muted">{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="eyebrow !text-ink-subtle">{operations.signalsTitle}</p>
      <ul className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {operations.signals.map((s, i) => (
          <li key={s.title} className="flex gap-4 bg-bg p-6 md:p-7">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-line-strong text-em">
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICONS[i]} /></svg>
            </span>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="max-w-3xl rounded-[var(--radius-card)] border border-dashed border-line-strong px-5 py-4 text-sm text-ink-muted">{operations.not}</p>
    </div>
  );
}
