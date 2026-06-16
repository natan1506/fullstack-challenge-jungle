import { describe, it, expect } from "bun:test";
import { Bet, BetStatus } from "../../src/domain/round/entities/bet.entity";

const BET_ID = "bet-1";
const ROUND_ID = "round-1";
const PLAYER_ID = "player-1";
const USERNAME = "player1";

describe("Bet", () => {
  it("creates a bet with pending status", () => {
    const bet = Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 1000n);
    expect(bet.status).toBe(BetStatus.PENDING);
    expect(bet.amountCents).toBe(1000n);
  });

  it("throws when bet is below minimum (100 cents)", () => {
    expect(() => Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 50n)).toThrow();
  });

  it("throws when bet is above maximum (100000 cents)", () => {
    expect(() => Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 200000n)).toThrow();
  });

  it("calculates payout on cashout", () => {
    const bet = Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 1000n);
    bet.cashOut(2.5);
    expect(bet.payoutCents).toBe(2500n);
    expect(bet.status).toBe(BetStatus.WON);
    expect(bet.cashOutMultiplier).toBe(2.5);
  });

  it("marks bet as lost", () => {
    const bet = Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 1000n);
    bet.lose();
    expect(bet.status).toBe(BetStatus.LOST);
  });

  it("cannot cashout twice", () => {
    const bet = Bet.create(BET_ID, ROUND_ID, PLAYER_ID, USERNAME, 1000n);
    bet.cashOut(2.0);
    expect(() => bet.cashOut(3.0)).toThrow();
  });
});
