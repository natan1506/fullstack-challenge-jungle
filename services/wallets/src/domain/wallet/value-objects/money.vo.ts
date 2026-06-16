export class Money {
  private constructor(private readonly amountInCents: bigint) {}

  static of(cents: bigint): Money {
    if (cents < 0n) throw new Error("Money cannot be negative");
    return new Money(cents);
  }

  static fromDecimal(value: number): Money {
    return new Money(BigInt(Math.round(value * 100)));
  }

  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  subtract(other: Money): Money {
    const result = this.amountInCents - other.amountInCents;
    if (result < 0n) throw new Error("Insufficient funds");
    return new Money(result);
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInCents >= other.amountInCents;
  }

  get cents(): bigint {
    return this.amountInCents;
  }

  toDecimal(): number {
    return Number(this.amountInCents) / 100;
  }
}
