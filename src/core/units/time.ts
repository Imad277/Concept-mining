/**
 * Period conventions. A "month" is an average Gregorian month so that
 * 12 months == 1 year exactly and figures reconcile across periods.
 */
export const DAYS_PER_YEAR = 365.25;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / MONTHS_PER_YEAR; // 30.4375
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_DAY = 86_400;
export const MS_PER_DAY = SECONDS_PER_DAY * 1_000;

export type Period = "day" | "month" | "year";

export const DAYS_IN: Record<Period, number> = {
  day: 1,
  month: DAYS_PER_MONTH,
  year: DAYS_PER_YEAR,
};
