import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { claims, claimStatus, company, isPublicApproved } from "@/config";
import { CLAIM_QUALIFIER } from "@/components/ui/Claim";
import { setAnalyticsConsent, setAnalyticsSink, track } from "@/lib/analytics";
import { organizationJsonLd } from "@/lib/seo";
import { seoPages } from "@/content/seo.de";

const SRC = join(__dirname, "..", "src");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) && !n.endsWith(".test.ts") ? [p] : [];
  });
const uiSources = [...files(join(SRC, "content")), ...files(join(SRC, "features")), ...files(join(SRC, "app"))].map((f) => ({ f, src: readFileSync(f, "utf8") }));

describe("content legal-status flags", () => {
  it("every non-approved claim status has a visible qualifier", () => {
    for (const id of Object.keys(claims) as (keyof typeof claims)[]) {
      if (!isPublicApproved(id)) expect(CLAIM_QUALIFIER[claimStatus(id)], id).toBeTruthy();
    }
  });
  it("every approved claim documents who approved it", () => {
    for (const id of Object.keys(claims) as (keyof typeof claims)[]) {
      if (claimStatus(id) === "MARKETING_APPROVED") expect(claims[id].source, id).toMatch(/Freigabe/);
    }
  });
});

describe("compliance wording", () => {
  it("solar share is only communicated as „bis zu 70 %“, never as an average", () => {
    const offenders = uiSources.filter(({ src }) => /(ca\.|rund|durchschnittlich|im Schnitt)\s*70\s*%/i.test(src)).map((s) => s.f);
    expect(offenders).toEqual([]);
  });
  it("no artificial scarcity or guaranteed-return marketing", () => {
    const re = /(nur noch \d+|limitierte plätze|jetzt sichern|garantierte rendite|sichere rendite)/i;
    expect(uiSources.filter(({ src }) => re.test(src)).map((s) => s.f)).toEqual([]);
  });
  it("12-month amortisation is never promised", () => {
    const re = /(amortisation|amortisiert)[^.\n]{0,40}(in|nach|innerhalb von)\s*12\s*monat/i;
    expect(uiSources.filter(({ src }) => re.test(src)).map((s) => s.f)).toEqual([]);
  });
  it("the securities identifiers appear only in the Impressum/config, never next to the mining model", () => {
    const offenders = uiSources.filter(({ f, src }) => src.includes(company.subsidiary.isin) && !f.includes("impressum")).map((s) => s.f);
    expect(offenders).toEqual([]);
  });
});

describe("structured data", () => {
  it("never declares a regulated product type", () => {
    const all = uiSources.map((s) => s.src).join("\n") + readFileSync(join(SRC, "lib", "seo.ts"), "utf8");
    expect(all).not.toMatch(/"(InvestmentFund|FinancialProduct|InvestmentOrDeposit)"/);
  });
  it("organization is the brand with the holding as parent", () => {
    const o = organizationJsonLd();
    expect(o.name).toBe("Concept Mining");
    expect(o.parentOrganization.name).toBe("Linden Concept Holding GmbH");
  });
  it("every SEO page has a direct answer, sections, FAQ and valid related links", () => {
    const slugs = new Set(seoPages.map((p) => p.slug));
    expect(slugs.size).toBe(8);
    for (const p of seoPages) {
      expect(p.answer.length).toBeGreaterThan(120);
      expect(p.sections.length).toBeGreaterThanOrEqual(3);
      expect(p.faq.length).toBeGreaterThanOrEqual(2);
      for (const r of p.related) expect(slugs.has(r), `${p.slug} → ${r}`).toBe(true);
      expect(p.description.length).toBeLessThanOrEqual(170);
    }
  });
});

describe("analytics", () => {
  it("sends nothing before consent", () => {
    const seen: string[] = [];
    setAnalyticsSink({ track: (e) => seen.push(e.name) });
    setAnalyticsConsent(false);
    track({ name: "calculator_started" });
    expect(seen).toEqual([]);
    setAnalyticsConsent(true);
    track({ name: "calculator_started" });
    expect(seen).toEqual(["calculator_started"]);
    setAnalyticsConsent(false);
  });
});
