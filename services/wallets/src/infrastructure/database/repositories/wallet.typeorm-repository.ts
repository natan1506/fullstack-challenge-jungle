import type { WalletRepository } from "../../../domain/wallet/repositories/wallet.repository";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WalletOrmEntity } from "../entities/wallet.orm-entity";
import { Repository } from "typeorm";
import { Wallet } from "../../../domain/wallet/entities/wallet.entity";

@Injectable()
export class WalletTypeOrmRepository implements WalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repo: Repository<WalletOrmEntity>,
  ) {}

  async save(wallet: Wallet): Promise<void> {
    await this.repo.save({
      id: wallet.id,
      playerId: wallet.playerId,
      balanceCents: wallet.balance.cents.toString(),
      createdAt: wallet.createdAt,
    });
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const orm = await this.repo.findOne({ where: { playerId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findById(id: string): Promise<Wallet | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  private toDomain(orm: WalletOrmEntity): Wallet {
    return Wallet.restore(
      orm.id,
      orm.playerId,
      BigInt(orm.balanceCents),
      orm.createdAt,
    );
  }
}
