import type { Bps, EurCents } from "@/core";
import { placeholder, unknown } from "@/core";

const SRC = "config/operations.ts";

export const operationsDefaults = {
  poolFeeBps: placeholder<Bps>(200 as Bps, SRC, "Typical FPPS pool fee range 1.5–2.5 %; pool not yet selected."),
  maintenanceCostPerPhMonth: placeholder<EurCents>(15_00 as EurCents, SRC, "Repairs, spare parts, firmware per PH per month."),
  operationsCostPerPhMonth: placeholder<EurCents>(60_00 as EurCents, SRC, "Staff, monitoring, insurance, connectivity, security per PH per month."),
  /** Linden fee / revenue share. Unknown until the commercial model is defined. */
  platformFeeBps: unknown<Bps>(SRC, "Linden fee model not yet defined."),
};
