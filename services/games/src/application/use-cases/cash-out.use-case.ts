import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Bet } from "../../domain/round/entities/bet.entity";
import { ROUND_REPOSITORY } from "../../domain/round/repositories/round.repository";
import type { RoundRepository } from "../../domain/round/repositories/round.repository";
import { WalletEventsPublisher } from "../../infrastructure/messaging/wallet-events.publisher";
import { GameGateway } from "../../presentation/gateways/game.gateway";

@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepo: RoundRepository,
    private readonly publisher: WalletEventsPublisher,
    private readonly gateway: GameGateway,
  ) {}

  async execute(playerId: string): Promise<Bet> {
    const round = await this.roundRepo.findCurrent();
    if (!round) throw new NotFoundException("No active round");

    const multiplier = round.getCurrentMultiplier();
    let bet: Bet;
    try {
      bet = round.cashOut(playerId, multiplier);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    // Atomic conditional UPDATE: prevents two concurrent cashouts from both succeeding.
    // If another request already settled this bet, affected rows = 0.
    const settled = await this.roundRepo.cashOutBetAtomic(
      bet.id,
      multiplier,
      bet.payoutCents!,
    );
    if (!settled) throw new ConflictException("Bet already settled");

    await this.publisher.publishCreditRequest({
      betId: bet.id,
      playerId,
      amountCents: bet.payoutCents!.toString(),
    });

    this.gateway.emitCashOut({
      id: bet.id,
      playerId: bet.playerId,
      username: bet.username,
      cashOutMultiplier: multiplier,
      payoutCents: bet.payoutCents!.toString(),
    });

    return bet;
  }
}
