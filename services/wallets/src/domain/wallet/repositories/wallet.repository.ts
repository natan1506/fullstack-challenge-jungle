import { Wallet } from "../entities/wallet.entity";

export type WalletRepository = {
  save(wallet: Wallet): Promise<void>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  findById(id: string): Promise<Wallet | null>;
};

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");
