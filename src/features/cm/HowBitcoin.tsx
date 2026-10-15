import Link from "next/link";
import { ArrowRight } from "@/components/ui/Icons";
import { howBitcoin } from "@/content/site.de";

/** Tiny illustrations per step (decorative). */
function StepArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <svg viewBox="0 0 120 56" className="h-14 w-auto" aria-hidden>
        {Array.from({ length: 8 }, (_, k) => (
          <text key={k} x={4 + (k % 4) * 29} y={k < 4 ? 20 : 44} fontSize="10" fontFamily="var(--font-dm-mono)" fill={k === 6 ? "var(--em)" : "var(--ink-subtle)"} opacity={k === 6 ? 1 : 0.6}>
            {["a3f9", "07c1", "e8b2", "5d04", "9a7e", "c3d1", "0000", "b48f"][k]}
          </text>
        ))}
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 120 56" className="h-14 w-auto" aria-hidden fill="none" strokeWidth="1.4">
        {[0, 1, 2].map((k) => <rect key={k} x={6 + k * 38} y={14} width="28" height="28" rx="4" stroke={k === 2 ? "var(--data-btc)" : "var(--line-strong)"} fill={k === 2 ? "rgb(227 160 74 / 0.18)" : "none"} />)}
        <path d="M34 28h10M72 28h10" stroke="var(--line-strong)" />
      </svg>
    );
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-auto" aria-hidden>
      <circle cx="28" cy="28" r="22" fill="none" stroke="var(--line-strong)" strokeWidth="9" />
      <circle cx="28" cy="28" r="22" fill="none" stroke="var(--em)" strokeWidth="9" strokeDasharray={`${2 * Math.PI * 22 * 0.3} 999`} transform="rotate(-90 28 28)" />
      <path d="M62 22h48M62 34h32" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 02 · So entsteht Bitcoin – three steps, no jargon. */
export function HowBitcoin() {
  return (
    <div>
      <ol className="grid gap-4 md:grid-cols-3">
        {howBitcoin.steps.map((s, i) => (
          <li key={s.title} className="card flex flex-col gap-5 p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[11px] tracking-[0.15em] text-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <StepArt i={i} />
            </div>
            <div>
              <p className="font-serif text-card">{s.title}</p>
              <p className="mt-2 text-ink-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/bitcoin-mining" className="mt-8 inline-flex items-center gap-2 border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">
        {howBitcoin.more} <ArrowRight />
      </Link>
    </div>
  );
}
