import { Round } from "../entities/round.entity";

export type RoundRepository = {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
  findCurrent(): Promise<Round | null>;
  findHistory(page: number, limit: number): Promise<{ rounds: Round[]; total: number }>;
  /**
   * Atomically transitions a bet from pending→won using a conditional UPDATE.
   * Returns false if the bet was already settled (concurrent cashout protection).
   */
  cashOutBetAtomic(betId: string, cashOutMultiplier: number, payoutCents: bigint): Promise<boolean>;
};

export const ROUND_REPOSITORY = Symbol("ROUND_REPOSITORY");
