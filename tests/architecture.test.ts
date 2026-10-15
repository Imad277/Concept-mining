import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

/** Source without comments, so documentation may mention forbidden APIs. */
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p, ext);
    return ext.test(name) && !name.endsWith(".test.ts") ? [p] : [];
  });
}

describe("architecture boundaries", () => {
  it("src/core is pure: no framework, IO, config, clock or env access", () => {
    const forbidden = [/from ["']react/, /from ["']next/, /from ["']@\/(config|server|features|components|lib|app)/, /from ["']zod/, /\bfetch\(/, /process\.env/, /Date\.now\(/, /new Date\(\)/];
    const offenders = files(join(SRC, "core"), /\.ts$/).flatMap((f) => {
      const src = code(f);
      return forbidden.filter((re) => re.test(src)).map((re) => `${relative(ROOT, f)} matches ${re}`);
    });
    expect(offenders).toEqual([]);
  });

  it("UI code never calls low-level calculation functions directly", () => {
    // UI may only use runSimulation/runTreasury (+ types and formatting). Formulas live in src/core.
    const lowLevel = /\b(allocateCapacity|hashpriceDailyRevenue|networkDailyRevenue|energyForPeriod|energyPower|periodFigures|simulateInvestment|projectMonthly|simulateTreasury|expectedSatsPerDay|deriveHashpriceUsd|applyScenarioToMarket)\b/;
    const ui = [...files(join(SRC, "features"), /\.tsx?$/), ...files(join(SRC, "components"), /\.tsx?$/), ...files(join(SRC, "app"), /\.tsx?$/)];
    const offenders = ui.filter((f) => lowLevel.test(code(f))).map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("server-only modules are not imported by client components", () => {
    const clients = files(SRC, /\.tsx?$/).filter((f) => /^["']use client["']/m.test(readFileSync(f, "utf8")));
    const offenders = clients.filter((f) => /from ["']@\/server/.test(readFileSync(f, "utf8"))).map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});
