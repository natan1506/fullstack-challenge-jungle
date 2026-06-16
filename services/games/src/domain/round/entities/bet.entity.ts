export enum BetStatus {
  PENDING = "pending",
  WON = "won",
  LOST = "lost",
}

export class Bet {
  private constructor(
    public readonly id: string,
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly username: string,
    public readonly amountCents: bigint,
    private _status: BetStatus,
    private _cashOutMultiplier: number | null,
    private _payoutCents: bigint | null,
    public readonly createdAt: Date,
  ) {}

  static create(id: string, roundId: string, playerId: string, username: string, amountCents: bigint): Bet {
    if (amountCents < 100n) throw new Error("Minimum bet is 1.00");
    if (amountCents > 100000n) throw new Error("Maximum bet is 1000.00");
    return new Bet(id, roundId, playerId, username, amountCents, BetStatus.PENDING, null, null, new Date());
  }

  static restore(
    id: string, roundId: string, playerId: string, username: string,
    amountCents: bigint, status: BetStatus, cashOutMultiplier: number | null,
    payoutCents: bigint | null, createdAt: Date,
  ): Bet {
    return new Bet(id, roundId, playerId, username, amountCents, status, cashOutMultiplier, payoutCents, createdAt);
  }

  cashOut(multiplier: number): void {
    if (this._status !== BetStatus.PENDING) throw new Error("Bet is not pending");
    this._status = BetStatus.WON;
    this._cashOutMultiplier = multiplier;
    this._payoutCents = BigInt(Math.floor(Number(this.amountCents) * multiplier));
  }

  lose(): void {
    if (this._status !== BetStatus.PENDING) return;
    this._status = BetStatus.LOST;
  }

  get status(): BetStatus { return this._status; }
  get cashOutMultiplier(): number | null { return this._cashOutMultiplier; }
  get payoutCents(): bigint | null { return this._payoutCents; }
  get isPending(): boolean { return this._status === BetStatus.PENDING; }
}
