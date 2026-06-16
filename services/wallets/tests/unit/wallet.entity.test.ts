import { describe, it, expect } from "bun:test";
import { Wallet } from "../../src/domain/wallet/entities/wallet.entity";
import { Money } from "../../src/domain/wallet/value-objects/money.vo";

describe("Wallet", () => {
  const id = "wallet-abc";
  const playerId = "player-123";

  it("creates with zero balance", () => {
    const wallet = Wallet.create(id, playerId);
    expect(wallet.balance.cents).toBe(0n);
    expect(wallet.playerId).toBe(playerId);
  });

  it("credits balance", () => {
    const wallet = Wallet.create(id, playerId);
    wallet.credit(Money.of(500n));
    expect(wallet.balance.cents).toBe(500n);
  });

  it("debits balance", () => {
    const wallet = Wallet.create(id, playerId);
    wallet.credit(Money.of(500n));
    wallet.debit(Money.of(200n));
    expect(wallet.balance.cents).toBe(300n);
  });

  it("throws when debit exceeds balance", () => {
    const wallet = Wallet.create(id, playerId);
    wallet.credit(Money.of(100n));
    expect(() => wallet.debit(Money.of(200n))).toThrow();
  });

  it("restores from persistence with existing balance", () => {
    const wallet = Wallet.restore("w-1", playerId, 9999n, new Date());
    expect(wallet.balance.cents).toBe(9999n);
    expect(wallet.id).toBe("w-1");
  });
});
