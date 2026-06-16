import { Wallet } from "../../domain/wallet/entities/wallet.entity";
import { WALLET_REPOSITORY } from "../../domain/wallet/repositories/wallet.repository";
import type { WalletRepository } from "../../domain/wallet/repositories/wallet.repository";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}
  async execute(playerId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) throw new NotFoundException("Wallet not found");

    return wallet;
  }
}
