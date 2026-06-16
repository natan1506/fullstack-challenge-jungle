import { randomBytes } from "crypto";
import { CrashPoint } from "../value-objects/crash-point.vo";
import { Bet } from "./bet.entity";

export enum RoundStatus {
  BETTING = "betting",
  RUNNING = "running",
  CRASHED = "crashed",
}

export class Round {
  private constructor(
    public readonly id: string,
    public readonly serverSeed: string,
    public readonly crashPoint: CrashPoint,
    private _status: RoundStatus,
    private _bets: Bet[],
    public readonly createdAt: Date,
    private _startedAt: Date | null,
    private _crashedAt: Date | null,
  ) {}

  static create(id: string): Round {
    const serverSeed = randomBytes(32).toString("hex");
    const crashPoint = CrashPoint.generate(serverSeed, id);
    return new Round(id, serverSeed, crashPoint, RoundStatus.BETTING, [], new Date(), null, null);
  }

  static restore(
    id: string,
    serverSeed: string,
    crashPointValue: number,
    status: RoundStatus,
    bets: Bet[],
    createdAt: Date,
    startedAt: Date | null,
    crashedAt: Date | null,
  ): Round {
    const crashPoint = CrashPoint.generate(serverSeed, id);
    return new Round(id, serverSeed, crashPoint, status, bets, createdAt, startedAt, crashedAt);
  }

  start(): void {
    if (this._status !== RoundStatus.BETTING) throw new Error("Round is not in betting phase");
    this._status = RoundStatus.RUNNING;
    this._startedAt = new Date();
  }

  crash(): void {
    if (this._status !== RoundStatus.RUNNING) throw new Error("Round is not running");
    this._status = RoundStatus.CRASHED;
    this._crashedAt = new Date();
    for (const bet of this._bets) {
      if (bet.isPending) bet.lose();
    }
  }

  placeBet(bet: Bet): void {
    if (this._status !== RoundStatus.BETTING) throw new Error("Bets are closed");
    const alreadyBet = this._bets.some((b) => b.playerId === bet.playerId);
    if (alreadyBet) throw new Error("Player already has a bet in this round");
    this._bets.push(bet);
  }

  cashOut(playerId: string, currentMultiplier: number): Bet {
    if (this._status !== RoundStatus.RUNNING) throw new Error("Round is not running");
    const bet = this._bets.find((b) => b.playerId === playerId);
    if (!bet) throw new Error("No bet found for this player");
    bet.cashOut(currentMultiplier);
    return bet;
  }

  getCurrentMultiplier(): number {
    if (!this._startedAt || this._status === RoundStatus.BETTING) return 1.0;
    const elapsed = (Date.now() - this._startedAt.getTime()) / 1000;
    const multiplier = Math.pow(Math.E, 0.1 * elapsed);
    if (this._status === RoundStatus.CRASHED) return this.crashPoint.multiplier;
    return Math.min(Math.round(multiplier * 100) / 100, this.crashPoint.multiplier);
  }

  shouldCrash(): boolean {
    return this._status === RoundStatus.RUNNING &&
      this.getCurrentMultiplier() >= this.crashPoint.multiplier;
  }

  get status(): RoundStatus { return this._status; }
  get bets(): Bet[] { return [...this._bets]; }
  get startedAt(): Date | null { return this._startedAt; }
  get crashedAt(): Date | null { return this._crashedAt; }
}
