import { cn } from "./cn";

/**
 * Concept Mining — Bildmarke.
 * Ein offenes „C“ (Concept) mit drei Rechenlinien (Hashrate), die durch die
 * Öffnung laufen und in einem Block enden: Rechenleistung → Block.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30.9 9.1A15.5 15.5 0 1 0 30.9 30.9" stroke="#d6b66c" strokeWidth="2.4" />
        <path d="M13 14.5h11.5M13 25.5h11.5" stroke="#cfcfc8" strokeWidth="1.8" opacity=".8" />
        <path d="M13 20h16.5" stroke="#e7c995" strokeWidth="2.2" />
      </g>
      <rect x="32" y="17.75" width="4.5" height="4.5" rx="0.8" fill="#e2c08a" />
    </svg>
  );
}

/** Wortmarke „Concept Mining“: Bildmarke + Serifen-Versalien, „Mining“ in Gold. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} role="img" aria-label="Concept Mining">
      <LogoMark className="size-8 shrink-0 md:size-9" />
      <span aria-hidden className="whitespace-nowrap font-serif text-[1.3rem] uppercase leading-none tracking-[0.07em] md:text-[1.45rem]">
        Concept <span className="text-gold-500">Mining</span>
      </span>
    </span>
  );
}
