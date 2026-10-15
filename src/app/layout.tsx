import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Serif, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "@/config/validate";
import { SiteFooter } from "@/features/site/SiteFooter";
import { SiteHeader } from "@/features/site/SiteHeader";
import { jsonLdScript, organizationJsonLd, SITE_URL, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument-serif", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Concept Mining | Professionelle Bitcoin-Mining-Infrastruktur", template: "%s | Concept Mining" },
  description:
    "Concept Mining betreibt ein eigenes Bitcoin-Mining-Rechenzentrum mit Energie aus eigenen Solarparks und dem Netz. Eine Marke der Linden Concept Holding GmbH.",
  applicationName: "Concept Mining",
  openGraph: { type: "website", locale: "de_DE", siteName: "Concept Mining" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0e1013" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${manrope.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">Zum Inhalt</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript([organizationJsonLd(), websiteJsonLd()]) }} />
      </body>
    </html>
  );
}
