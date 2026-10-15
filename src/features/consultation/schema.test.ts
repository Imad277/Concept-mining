import { describe, expect, it } from "vitest";
import { consultationSchema } from "./schema";

const valid = {
  firstName: "Erika", lastName: "Muster", email: "erika@example.com", phone: "+49 30 123", interest: "mining-capacity",
  preferredAmount: "", simulatedAmount: "10000", scenarioId: "base", consent: true, website: "", startedAt: 1_700_000_000_000,
};

describe("consultation schema", () => {
  it("accepts valid contact data with simulation context", () => {
    const r = consultationSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.simulatedAmount).toBe(10_000);
    expect(r.data?.preferredAmount).toBeUndefined();
  });
  it("requires first and last name", () => {
    expect(consultationSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, lastName: " " }).success).toBe(false);
  });
  it("requires consent", () => {
    expect(consultationSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rejects filled honeypot", () => {
    expect(consultationSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
  });
  it("rejects invalid email, phone, interest and scenario", () => {
    expect(consultationSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, phone: "<script>" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, interest: "trading" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, scenarioId: "<x>" }).success).toBe(false);
  });
  it("rejects negative or absurd amounts", () => {
    expect(consultationSchema.safeParse({ ...valid, preferredAmount: "-5" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, preferredAmount: "999999999" }).success).toBe(false);
  });
});
