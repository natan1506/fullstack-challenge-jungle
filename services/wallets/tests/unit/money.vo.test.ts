import { describe, it, expect } from "bun:test";
import { Money } from "../../src/domain/wallet/value-objects/money.vo";

describe("Money", () => {
  it("creates from cents", () => {
    const m = Money.of(500n);
    expect(m.cents).toBe(500n);
  });

  it("creates from decimal string", () => {
    const m = Money.fromDecimal("10.50");
    expect(m.cents).toBe(1050n);
  });

  it("adds two amounts", () => {
    const result = Money.of(100n).add(Money.of(50n));
    expect(result.cents).toBe(150n);
  });

  it("subtracts amounts", () => {
    const result = Money.of(200n).subtract(Money.of(75n));
    expect(result.cents).toBe(125n);
  });

  it("converts to decimal", () => {
    expect(Money.of(1050n).toDecimal()).toBe(10.5);
  });

  it("compares greater than or equal", () => {
    expect(Money.of(100n).isGreaterThanOrEqual(Money.of(100n))).toBe(true);
    expect(Money.of(101n).isGreaterThanOrEqual(Money.of(100n))).toBe(true);
    expect(Money.of(99n).isGreaterThanOrEqual(Money.of(100n))).toBe(false);
  });
});
