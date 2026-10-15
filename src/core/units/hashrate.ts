import type { Brand } from "./brand";

/** Canonical hashrate unit of the platform: terahashes per second. */
export type TerahashPerSecond = Brand<number, "TH/s">;
export type PetahashPerSecond = Brand<number, "PH/s">;
/** Raw hashes per second, only used for network-level math. */
export type HashesPerSecond = Brand<number, "H/s">;

export const TH_PER_PH = 1_000;
export const H_PER_TH = 1e12;
export const H_PER_EH = 1e18;

export function th(value: number): TerahashPerSecond {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Hashrate must be >= 0 TH/s, got ${value}`);
  return value as TerahashPerSecond;
}

export function ph(value: number): PetahashPerSecond {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Hashrate must be >= 0 PH/s, got ${value}`);
  return value as PetahashPerSecond;
}

export function phToTh(value: PetahashPerSecond): TerahashPerSecond {
  return (value * TH_PER_PH) as TerahashPerSecond;
}

export function thToPh(value: TerahashPerSecond): PetahashPerSecond {
  return (value / TH_PER_PH) as PetahashPerSecond;
}

export function thToHs(value: TerahashPerSecond): HashesPerSecond {
  return (value * H_PER_TH) as HashesPerSecond;
}

export function hsToPh(value: HashesPerSecond): PetahashPerSecond {
  return (value / 1e15) as PetahashPerSecond;
}
