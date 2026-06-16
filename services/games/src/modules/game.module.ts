import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoundOrmEntity } from "../infrastructure/database/entities/round.orm-entity";
import { BetOrmEntity } from "../infrastructure/database/entities/bet.orm-entity";
import { RoundTypeOrmRepository } from "../infrastructure/database/repositories/round.typeorm-repository";
import { BetTypeOrmRepository } from "../infrastructure/database/repositories/bet.typeorm-repository";
import { ROUND_REPOSITORY } from "../domain/round/repositories/round.repository";
import { BET_REPOSITORY } from "../domain/round/repositories/bet.repository";
import { PlaceBetUseCase } from "../application/use-cases/place-bet.use-case";
import { CashOutUseCase } from "../application/use-cases/cash-out.use-case";
import { RoundEngineService } from "../application/services/round-engine.service";
import { WalletEventsPublisher } from "../infrastructure/messaging/wallet-events.publisher";
import { GameGateway } from "../presentation/gateways/game.gateway";
import { GamesController } from "../presentation/controllers/games.controller";

@Module({
  imports: [TypeOrmModule.forFeature([RoundOrmEntity, BetOrmEntity])],
  controllers: [GamesController],
  providers: [
    PlaceBetUseCase,
    CashOutUseCase,
    RoundEngineService,
    WalletEventsPublisher,
    GameGateway,
    { provide: ROUND_REPOSITORY, useClass: RoundTypeOrmRepository },
    { provide: BET_REPOSITORY, useClass: BetTypeOrmRepository },
  ],
})
export class GameModule {}
