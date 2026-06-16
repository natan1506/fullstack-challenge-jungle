import { WalletEventsConsumer } from "../infrastructure/messaging/wallet-events.consumer";
import { CreateWalletUseCase } from "../application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "../application/use-cases/get-wallet.use-case";
import { WALLET_REPOSITORY } from "../domain/wallet/repositories/wallet.repository";
import { WalletOrmEntity } from "../infrastructure/database/entities/wallet.orm-entity";
import { WalletTypeOrmRepository } from "../infrastructure/database/repositories/wallet.typeorm-repository";
import { WalletsController, HealthController } from "../presentation/controllers/wallets.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([WalletOrmEntity])],
  controllers: [HealthController, WalletsController],
  providers: [
    CreateWalletUseCase,
    GetWalletUseCase,
    WalletEventsConsumer,
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletTypeOrmRepository,
    },
  ],
})
export class WalletModule {}
