import type { Brand } from "./brand";

export type Watts = Brand<number, "W">;
export type Kilowatts = Brand<number, "kW">;
export type KilowattHours = Brand<number, "kWh">;
/** Hardware efficiency. J/TH is numerically equal to W per TH/s. */
export type JoulesPerTerahash = Brand<number, "J/TH">;

export function watts(value: number): Watts {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Power must be >= 0 W, got ${value}`);
  return value as Watts;
}

export function wattsToKw(value: Watts): Kilowatts {
  return (value / 1_000) as Kilowatts;
}

export function kwh(value: number): KilowattHours {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Energy must be >= 0 kWh, got ${value}`);
  return value as KilowattHours;
}

export function jPerTh(value: number): JoulesPerTerahash {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`Efficiency must be > 0 J/TH, got ${value}`);
  return value as JoulesPerTerahash;
}
