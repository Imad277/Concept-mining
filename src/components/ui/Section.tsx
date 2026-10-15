import type { ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "dark" | "deep" | "light" | "paper";

/**
 * Editorial section. `number` + `label` render the Linden eyebrow
 * ("01 / DAS MODELL"). `title` is the Manrope line, `titleEm` the serif line.
 * `layout="split"` puts the heading left and content right on desktop.
 */
export function Section({
  id, tone = "light", number, label, title, titleEm, intro, children, layout = "stack", size = "lg", className, headerAside,
}: {
  id?: string;
  tone?: Tone;
  number?: string;
  label?: string;
  title?: ReactNode;
  titleEm?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  layout?: "stack" | "split";
  size?: "lg" | "md" | "sm";
  className?: string;
  headerAside?: ReactNode;
}) {
  const pad = size === "lg" ? "py-20 md:py-28" : size === "md" ? "py-16 md:py-24" : "py-12 md:py-16";
  const header = (title || label) && (
    <header className={cn(layout === "split" ? "md:sticky md:top-28 md:self-start" : "max-w-3xl")}>
      {(number || label) && (
        <p className="eyebrow mb-5">{number && <span>{number} / </span>}{label}</p>
      )}
      {title && (
        <h2 id={id ? `${id}-title` : undefined} className="headline text-headline">
          {title}
          {titleEm && <span className="serif-em block">{titleEm}</span>}
        </h2>
      )}
      {intro && <div className="mt-6 max-w-xl space-y-4 text-lead text-ink-muted">{intro}</div>}
      {headerAside && <div className="mt-8">{headerAside}</div>}
    </header>
  );

  return (
    <section id={id} data-tone={tone} aria-labelledby={id && title ? `${id}-title` : undefined} className={cn("relative scroll-mt-16", pad, className)}>
      <div className="mx-auto w-full max-w-[1240px] px-5 md:px-10">
        {layout === "split" ? (
          <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
            {header}
            <div>{children}</div>
          </div>
        ) : (
          <>
            {header}
            {children && <div className={header ? "mt-12 md:mt-16" : undefined}>{children}</div>}
          </>
        )}
      </div>
    </section>
  );
}
