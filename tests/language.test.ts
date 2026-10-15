import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** No investor-facing text may promise returns or a guaranteed payback. */
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) && !n.endsWith(".test.ts") ? [p] : [];
  });

const FORBIDDEN = [
  /amortisation\s+(ist\s+)?garantiert/i,
  /garantierte?\s+(rendite|amortisation|auszahlung|ertr)/i,
  /rendite\s+(ist\s+)?garantiert/i,
  /sichere\s+rendite/i,
  /passives?\s+einkommen/i,
  /gewinn\s+garantiert/i,
  /risikolos/i,
  /garantierte?\s+(ki|ai)[- ]?gewinne/i,
  /guaranteed\s+ai\s+profits/i,
  // Performance claims for the trading system (only audited LIVE results could ever justify these)
  /\b(ki|ai|treasury|trading)[^.]{0,40}\b(generiert|erzielt|erwirtschaftet|bringt)\b[^.]{0,25}\d+\s*%\s*(p\.\s*a\.|jährlich|pro jahr)/i,
];

describe("no guaranteed-return language", () => {
  it("content, features and pages contain no return promises", () => {
    const root = join(__dirname, "..", "src");
    const offenders = [...files(join(root, "content")), ...files(join(root, "features")), ...files(join(root, "app"))].flatMap((f) => {
      const src = readFileSync(f, "utf8");
      return FORBIDDEN.filter((re) => re.test(src)).map((re) => `${f}: ${re}`);
    });
    expect(offenders).toEqual([]);
  });
});
