import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bet, BetStatus } from "../../../domain/round/entities/bet.entity";
import type { BetRepository } from "../../../domain/round/repositories/bet.repository";
import { BetOrmEntity } from "../entities/bet.orm-entity";

@Injectable()
export class BetTypeOrmRepository implements BetRepository {
  constructor(
    @InjectRepository(BetOrmEntity)
    private readonly repo: Repository<BetOrmEntity>,
  ) {}

  async save(bet: Bet): Promise<void> {
    await this.repo.save({
      id: bet.id,
      roundId: bet.roundId,
      playerId: bet.playerId,
      username: bet.username,
      amountCents: bet.amountCents.toString(),
      status: bet.status,
      cashOutMultiplier: bet.cashOutMultiplier?.toString() ?? null,
      payoutCents: bet.payoutCents?.toString() ?? null,
      createdAt: bet.createdAt,
    });
  }

  async findByPlayerAndRound(playerId: string, roundId: string): Promise<Bet | null> {
    const orm = await this.repo.findOne({ where: { playerId, roundId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByPlayer(playerId: string, page: number, limit: number): Promise<{ bets: Bet[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      where: { playerId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { bets: orms.map((o) => this.toDomain(o)), total };
  }

  private toDomain(orm: BetOrmEntity): Bet {
    return Bet.restore(
      orm.id, orm.roundId, orm.playerId, orm.username,
      BigInt(orm.amountCents), orm.status as BetStatus,
      orm.cashOutMultiplier ? parseFloat(orm.cashOutMultiplier) : null,
      orm.payoutCents ? BigInt(orm.payoutCents) : null,
      orm.createdAt,
    );
  }
}
