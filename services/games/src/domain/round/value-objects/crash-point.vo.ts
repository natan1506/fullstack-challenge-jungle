import { createHmac } from "crypto";

export class CrashPoint {
  private constructor(private readonly value: number) {}

  static generate(serverSeed: string, roundId: string): CrashPoint {
    const hmac = createHmac("sha256", serverSeed);
    hmac.update(roundId);
    const hash = hmac.digest("hex");

    const h = parseInt(hash.slice(0, 8), 16);
    const HOUSE_EDGE = 0.01;
    const e = 2 ** 32;

    if (h % 33 === 0) return new CrashPoint(1.0);

    const result = Math.floor((e / (e - h)) * (1 - HOUSE_EDGE) * 100) / 100;
    return new CrashPoint(Math.max(1.0, result));
  }

  static verify(serverSeed: string, roundId: string, crashPoint: number): boolean {
    const computed = CrashPoint.generate(serverSeed, roundId);
    return computed.value === crashPoint;
  }

  get multiplier(): number {
    return this.value;
  }
}
