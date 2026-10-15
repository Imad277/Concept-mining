import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Datenschutzerklärung", robots: { index: false } };

/** Legal shell. Content must come from Linden's legal counsel. */
export default function Page() {
  return (
    <>
      <div data-tone="dark" className="h-[var(--header-h)]" />
      <Section tone="paper" title="Datenschutzerklärung" intro={<p>Inhalt folgt nach rechtlicher Prüfung.</p>} />
    </>
  );
}
