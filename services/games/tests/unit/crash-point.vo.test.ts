import { describe, it, expect } from "bun:test";
import { CrashPoint } from "../../src/domain/round/value-objects/crash-point.vo";

describe("CrashPoint", () => {
  it("generates a crash point at or above 1.0", () => {
    const cp = CrashPoint.generate("server-seed-abc", "round-001");
    expect(cp.multiplier).toBeGreaterThanOrEqual(1.0);
  });

  it("is deterministic for the same inputs", () => {
    const a = CrashPoint.generate("seed-xyz", "round-42");
    const b = CrashPoint.generate("seed-xyz", "round-42");
    expect(a.multiplier).toBe(b.multiplier);
  });

  it("differs for different round ids", () => {
    const a = CrashPoint.generate("same-seed", "round-1");
    const b = CrashPoint.generate("same-seed", "round-2");
    expect(a.multiplier).not.toBe(b.multiplier);
  });

  it("verifies a round correctly", () => {
    const seed = "verifiable-seed";
    const roundId = "round-verify-test";
    const cp = CrashPoint.generate(seed, roundId);
    expect(CrashPoint.verify(seed, roundId, cp.multiplier)).toBe(true);
  });

  it("fails verification with wrong seed", () => {
    const cp = CrashPoint.generate("real-seed", "round-1");
    expect(CrashPoint.verify("wrong-seed", "round-1", cp.multiplier)).toBe(false);
  });
});
