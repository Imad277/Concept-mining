/**
 * Machine-readable simulation issues. The UI maps `code` to localized copy;
 * `message` is a developer-facing English fallback.
 */
export type IssueSeverity = "BLOCKING" | "WARNING" | "INFO";

export type IssueCode =
  | "MISSING_BTC_PRICE"
  | "MISSING_HASHPRICE"
  | "MISSING_DIFFICULTY"
  | "MISSING_BLOCK_REWARD"
  | "MISSING_ENERGY_ASSUMPTION"
  | "MISSING_CAPEX"
  | "MISSING_HARDWARE_EFFICIENCY"
  | "INVESTMENT_OUT_OF_RANGE"
  | "MARKET_DATA_DELAYED"
  | "MARKET_DATA_STALE"
  | "PLACEHOLDER_ASSUMPTION"
  | "GENERIC_HARDWARE_BASIS"
  | "FEE_MODEL_UNDEFINED"
  | "ZERO_HASHPRICE"
  | "NEGATIVE_OPERATING_RESULT"
  | "BREAK_EVEN_NOT_REACHED"
  | "SCENARIO_INCONSISTENT"
  | "MODE_DEVIATION_HIGH"
  | "SOLAR_CAPEX_DOUBLE_COUNT_RISK"
  | "HALVING_DATE_UNKNOWN"
  | "MISSING_OPERATING_ASSUMPTION"
  | "BLOCK_FEES_UNAVAILABLE";

export interface SimulationIssue {
  code: IssueCode;
  severity: IssueSeverity;
  field?: string;
  message: string;
}

export function blocking(code: IssueCode, message: string, field?: string): SimulationIssue {
  return { code, severity: "BLOCKING", message, ...(field ? { field } : {}) };
}

export function warning(code: IssueCode, message: string, field?: string): SimulationIssue {
  return { code, severity: "WARNING", message, ...(field ? { field } : {}) };
}

export function info(code: IssueCode, message: string, field?: string): SimulationIssue {
  return { code, severity: "INFO", message, ...(field ? { field } : {}) };
}
