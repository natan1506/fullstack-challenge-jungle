import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Bet } from "../../domain/round/entities/bet.entity";
import { ROUND_REPOSITORY } from "../../domain/round/repositories/round.repository";
import type { RoundRepository } from "../../domain/round/repositories/round.repository";
import { WalletEventsPublisher } from "../../infrastructure/messaging/wallet-events.publisher";
import { GameGateway } from "../../presentation/gateways/game.gateway";

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepo: RoundRepository,
    private readonly publisher: WalletEventsPublisher,
    private readonly gateway: GameGateway,
  ) {}

  async execute(playerId: string, username: string, amountCents: bigint): Promise<Bet> {
    const round = await this.roundRepo.findCurrent();
    if (!round) throw new NotFoundException("No active round");

    const bet = Bet.create(randomUUID(), round.id, playerId, username, amountCents);
    try {
      round.placeBet(bet);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    await this.roundRepo.save(round);

    await this.publisher.publishDebitRequest({
      betId: bet.id,
      playerId,
      amountCents: amountCents.toString(),
    });

    this.gateway.emitBetPlaced({
      id: bet.id,
      playerId: bet.playerId,
      username: bet.username,
      amountCents: bet.amountCents.toString(),
    });

    return bet;
  }
}
