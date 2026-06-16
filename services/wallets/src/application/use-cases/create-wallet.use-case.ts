import { Wallet } from "../../domain/wallet/entities/wallet.entity";
import { WALLET_REPOSITORY } from "../../domain/wallet/repositories/wallet.repository";
import type { WalletRepository } from "../../domain/wallet/repositories/wallet.repository";
import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(playerId);
    if (existing)
      throw new ConflictException("Wallet already exists for this player");

    const wallet = Wallet.create(randomUUID(), playerId);
    await this.walletRepository.save(wallet);
    return wallet;
  }
}
