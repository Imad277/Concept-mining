"use client";

import type { EurCents } from "@/core";

/** Lets other sections (e.g. package cards) preset the simulation and jump to it. */
const EVENT = "lc:simulate";

export function openSimulation(amount: EurCents): void {
  window.dispatchEvent(new CustomEvent<{ amount: EurCents }>(EVENT, { detail: { amount } }));
  document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function onOpenSimulation(handler: (amount: EurCents) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ amount: EurCents }>).detail.amount);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
