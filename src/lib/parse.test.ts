import { describe, expect, it } from "vitest";
import { parseLocaleNumber } from "./parse";

describe("parseLocaleNumber", () => {
  it.each([
    ["73.904", 73904],
    ["1.234.567", 1234567],
    ["1.234,5", 1234.5],
    ["18,5", 18.5],
    ["1.1", 1.1],
    ["1,10", 1.1],
    ["85000", 85000],
    ["-20", -20],
    ["95 %", 95],
    ["", null],
    ["abc", null],
    ["1,2,3", null],
  ])("%s → %s", (input, expected) => {
    expect(parseLocaleNumber(input)).toBe(expected);
  });
});
