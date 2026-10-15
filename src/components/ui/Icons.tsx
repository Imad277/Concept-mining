import type { SVGProps } from "react";

/** 1.5 px line icons on a 20 px grid. Decorative unless given a title. */
const base = (p: SVGProps<SVGSVGElement>) => ({ width: 16, height: 16, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M6 14 14 6M7.5 6H14v6.5" /></svg>);
export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 10h12M11 5l5 5-5 5" /></svg>);
export const ArrowDown = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M10 4v12M5 11l5 5 5-5" /></svg>);
export const Plus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M10 4v12M4 10h12" /></svg>);
export const Minus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 10h12" /></svg>);
export const Menu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 6h14M3 10h14M3 14h14" /></svg>);
export const Close = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m5 5 10 10M15 5 5 15" /></svg>);
