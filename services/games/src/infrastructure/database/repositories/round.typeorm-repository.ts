import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Round, RoundStatus } from "../../../domain/round/entities/round.entity";
import { Bet, BetStatus } from "../../../domain/round/entities/bet.entity";
import type { RoundRepository } from "../../../domain/round/repositories/round.repository";
import { RoundOrmEntity } from "../entities/round.orm-entity";
import { BetOrmEntity } from "../entities/bet.orm-entity";

@Injectable()
export class RoundTypeOrmRepository implements RoundRepository {
  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly repo: Repository<RoundOrmEntity>,
    @InjectRepository(BetOrmEntity)
    private readonly betRepo: Repository<BetOrmEntity>,
  ) {}

  async save(round: Round): Promise<void> {
    await this.repo.save({
      id: round.id,
      serverSeed: round.serverSeed,
      crashPoint: round.crashPoint.multiplier.toString(),
      status: round.status,
      createdAt: round.createdAt,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
    });

    if (round.bets.length > 0) {
      await this.betRepo.save(
        round.bets.map((b) => ({
          id: b.id,
          roundId: b.roundId,
          round: { id: b.roundId }, // ensures FK roundId column is set
          playerId: b.playerId,
          username: b.username,
          amountCents: b.amountCents.toString(),
          status: b.status,
          cashOutMultiplier: b.cashOutMultiplier?.toString() ?? null,
          payoutCents: b.payoutCents?.toString() ?? null,
          createdAt: b.createdAt,
        })),
      );
    }
  }

  async findById(id: string): Promise<Round | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ["bets"] });
    return orm ? this.toDomain(orm) : null;
  }

  async findCurrent(): Promise<Round | null> {
    const orm = await this.repo.findOne({
      where: [{ status: RoundStatus.BETTING }, { status: RoundStatus.RUNNING }],
      relations: ["bets"],
      order: { createdAt: "DESC" },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async cashOutBetAtomic(betId: string, cashOutMultiplier: number, payoutCents: bigint): Promise<boolean> {
    const result = await this.betRepo.update(
      { id: betId, status: BetStatus.PENDING },
      {
        status: BetStatus.WON,
        cashOutMultiplier: cashOutMultiplier.toString(),
        payoutCents: payoutCents.toString(),
      },
    );
    return (result.affected ?? 0) > 0;
  }

  async findHistory(page: number, limit: number): Promise<{ rounds: Round[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      where: { status: RoundStatus.CRASHED },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["bets"],
    });
    return { rounds: orms.map((o) => this.toDomain(o)), total };
  }

  private toDomain(orm: RoundOrmEntity): Round {
    const bets = (orm.bets ?? []).map((b) =>
      Bet.restore(
        b.id, b.roundId, b.playerId, b.username,
        BigInt(b.amountCents), b.status as BetStatus,
        b.cashOutMultiplier ? parseFloat(b.cashOutMultiplier) : null,
        b.payoutCents ? BigInt(b.payoutCents) : null,
        b.createdAt,
      ),
    );
    return Round.restore(
      orm.id, orm.serverSeed, parseFloat(orm.crashPoint),
      orm.status as RoundStatus, bets, orm.createdAt, orm.startedAt, orm.crashedAt,
    );
  }
}
