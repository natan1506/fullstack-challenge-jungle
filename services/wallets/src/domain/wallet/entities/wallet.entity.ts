import { Money } from "../value-objects/money.vo";

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    private _balance: Money,
    public readonly createdAt: Date,
  ) {}

  static create(id: string, playerId: string): Wallet {
    return new Wallet(id, playerId, Money.of(0n), new Date());
  }

  static restore(
    id: string,
    playerId: string,
    balanceCents: bigint,
    createdAt: Date,
  ): Wallet {
    return new Wallet(id, playerId, Money.of(balanceCents), createdAt);
  }

  credit(amount: Money): void {
    this._balance = this._balance.add(amount);
  }

  debit(amount: Money): void {
    this._balance = this._balance.subtract(amount);
  }

  get balance(): Money {
    return this._balance;
  }
}
