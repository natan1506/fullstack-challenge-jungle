import { Bet } from "../entities/bet.entity";

export type BetRepository = {
  save(bet: Bet): Promise<void>;
  findByPlayerAndRound(playerId: string, roundId: string): Promise<Bet | null>;
  findByPlayer(playerId: string, page: number, limit: number): Promise<{ bets: Bet[]; total: number }>;
};

export const BET_REPOSITORY = Symbol("BET_REPOSITORY");
