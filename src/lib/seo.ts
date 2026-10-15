import { company } from "@/config";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * schema.org builders. InvestmentFund / FinancialProduct are intentionally NOT
 * used: the legal structure of the offering is not confirmed (see claims.ts).
 */
const parent = {
  "@type": "Organization",
  name: company.legalName,
  email: company.email,
  address: { "@type": "PostalAddress", streetAddress: company.street, postalCode: company.postalCode, addressLocality: company.city, addressCountry: company.country },
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: company.brand,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: "Professionelle Bitcoin-Mining-Infrastruktur. " + company.brandLine,
    email: company.email,
    parentOrganization: parent,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: company.brand,
    url: SITE_URL,
    inLanguage: "de-DE",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

export function articleJsonLd(a: { headline: string; description: string; path: string; dateModified: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    inLanguage: "de-DE",
    mainEntityOfPage: `${SITE_URL}${a.path}`,
    dateModified: a.dateModified,
    datePublished: a.dateModified,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
