import type { SVGProps } from "react";

/** 1.5 px line icons on a 32 px grid for the value chain. Decorative. */
const base = (p: SVGProps<SVGSVGElement>) => ({ width: 28, height: 28, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const StationIcon = {
  energy: (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="10" r="4" /><path d="M11 2v2M11 16v2M3 10h2M17 10h2M5.3 4.3l1.4 1.4M15.3 14.3l1.4 1.4M5.3 15.7l1.4-1.4M15.3 5.7l1.4-1.4" /><path d="m21 15-4 8h5l-2 7 7-10h-5l2-5z" /></svg>),
  datacenter: (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="5" y="5" width="22" height="7" rx="1.5" /><rect x="5" y="14" width="22" height="7" rx="1.5" /><rect x="5" y="23" width="22" height="4" rx="1.5" /><path d="M9 8.5h.01M9 17.5h.01M13 8.5h9M13 17.5h9" /></svg>),
  compute: (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="9" y="9" width="14" height="14" rx="2" /><rect x="13" y="13" width="6" height="6" rx="1" /><path d="M13 5v4M19 5v4M13 23v4M19 23v4M5 13h4M5 19h4M23 13h4M23 19h4" /></svg>),
  network: (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3" y="12" width="8" height="8" rx="1.5" /><rect x="21" y="4" width="8" height="8" rx="1.5" /><rect x="21" y="20" width="8" height="8" rx="1.5" /><path d="M11 16h4m0 0V8h6m-6 8v8h6" /></svg>),
  result: (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 26h22" /><path d="M8 22v-5M14 22v-9M20 22v-7M26 22V8" /><path d="m7 12 6-5 6 4 7-6" /></svg>),
};
export type StationId = keyof typeof StationIcon;
