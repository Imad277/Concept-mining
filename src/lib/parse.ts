/**
 * Parses numbers typed by German-speaking users.
 * - "1.234,5" → 1234.5 (dot = thousands, comma = decimal)
 * - "73.904"  → 73904  (single dot followed by exactly 3 digits = thousands)
 * - "1.1" / "1,1" → 1.1
 * Returns null for anything that is not a finite number.
 */
export function parseLocaleNumber(input: string): number | null {
  let s = input.trim().replace(/\s/g, "").replace(/€|%/g, "");
  if (s === "") return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
