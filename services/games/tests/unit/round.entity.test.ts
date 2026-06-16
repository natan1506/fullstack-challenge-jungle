import { describe, it, expect } from "bun:test";
import { Round, RoundStatus } from "../../src/domain/round/entities/round.entity";
import { Bet } from "../../src/domain/round/entities/bet.entity";

const ROUND_ID = "round-test-001";

describe("Round", () => {
  it("starts in betting phase", () => {
    const round = Round.create(ROUND_ID);
    expect(round.status).toBe(RoundStatus.BETTING);
  });

  it("transitions to running on start()", () => {
    const round = Round.create(ROUND_ID);
    round.start();
    expect(round.status).toBe(RoundStatus.RUNNING);
  });

  it("transitions to crashed on crash()", () => {
    const round = Round.create(ROUND_ID);
    round.start();
    round.crash();
    expect(round.status).toBe(RoundStatus.CRASHED);
  });

  it("cannot place bet after start", () => {
    const round = Round.create(ROUND_ID);
    round.start();
    const bet = Bet.create("b-1", ROUND_ID, "player-1", "player1", 1000n);
    expect(() => round.placeBet(bet)).toThrow();
  });

  it("accepts a bet during betting phase", () => {
    const round = Round.create(ROUND_ID);
    const bet = Bet.create("b-1", ROUND_ID, "player-1", "player1", 1000n);
    round.placeBet(bet);
    expect(round.bets).toHaveLength(1);
  });

  it("rejects duplicate bet from same player", () => {
    const round = Round.create(ROUND_ID);
    const bet1 = Bet.create("b-1", ROUND_ID, "player-1", "player1", 1000n);
    const bet2 = Bet.create("b-2", ROUND_ID, "player-1", "player1", 500n);
    round.placeBet(bet1);
    expect(() => round.placeBet(bet2)).toThrow();
  });

  it("marks pending bets as lost when round crashes", () => {
    const round = Round.create(ROUND_ID);
    const bet = Bet.create("b-1", ROUND_ID, "player-1", "player1", 1000n);
    round.placeBet(bet);
    round.start();
    round.crash();
    expect(round.bets[0].status).toBe("lost");
  });

  it("has crash point at or above 1.0", () => {
    const round = Round.create(ROUND_ID);
    expect(round.crashPoint.multiplier).toBeGreaterThanOrEqual(1.0);
  });
});
