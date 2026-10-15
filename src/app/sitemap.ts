import type { MetadataRoute } from "next";
import { seoPages } from "@/content/seo.de";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const core = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/simulation", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/wissen", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/methodik", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/risikohinweise", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/impressum", priority: 0.2, changeFrequency: "yearly" as const },
  ];
  return [
    ...core.map((c) => ({ url: `${SITE_URL}${c.path}`, changeFrequency: c.changeFrequency, priority: c.priority })),
    ...seoPages.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: p.updated, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
