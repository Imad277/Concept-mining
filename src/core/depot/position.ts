import type { EurCents, Sats, TerahashPerSecond, Bps } from "../units";

/**
 * FUTURE BOUNDARY — Linden CRM/Depot integration (not implemented in V1).
 *
 * The Depot will own investor positions. This platform will only map its own
 * simulation/operational data into this shape through an adapter that lives in
 * src/server/depot/. No code in V1 imports or calls the Linden system.
 */
export const DEPOT_POSITION_CATEGORY = "BITCOIN_MINING" as const;

export interface MiningValuationSnapshot {
  asOf: string;
  minedBtcSats: Sats;
  grossMiningRevenue: EurCents;
  energyCost: EurCents;
  operationsCost: EurCents;
  netMiningResult: EurCents;
  treasuryResult: EurCents | null;
  positionValue: EurCents;
  uptimeBps: Bps;
  /** "SIMULATED" must never be shown as an actual position value. */
  basis: "ACTUAL" | "SIMULATED";
}

export interface MiningInvestmentPosition {
  category: typeof DEPOT_POSITION_CATEGORY;
  positionId: string;
  investorId: string;
  investmentAmount: EurCents;
  allocatedHashrateTH: TerahashPerSecond;
  hardwareProfileId: string;
  startDate: string;
  minedBtcSats: Sats;
  grossMiningRevenue: EurCents;
  energyCost: EurCents;
  operationsCost: EurCents;
  netMiningResult: EurCents;
  treasuryResult: EurCents | null;
  positionValue: EurCents;
  uptimeBps: Bps;
  valuationSnapshots: MiningValuationSnapshot[];
}

/** Port to be implemented by a Depot adapter in a later phase. */
export interface DepotPositionGateway {
  getPositions(investorId: string): Promise<MiningInvestmentPosition[]>;
  getSnapshots(positionId: string, from: string, to: string): Promise<MiningValuationSnapshot[]>;
}
