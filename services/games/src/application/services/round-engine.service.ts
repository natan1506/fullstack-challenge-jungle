import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Round } from "../../domain/round/entities/round.entity";
import { ROUND_REPOSITORY } from "../../domain/round/repositories/round.repository";
import type { RoundRepository } from "../../domain/round/repositories/round.repository";
import { GameGateway } from "../../presentation/gateways/game.gateway";

const BETTING_PHASE_MS = 20_000;
const TICK_MS = 100;

@Injectable()
export class RoundEngineService implements OnModuleInit {
  private readonly logger = new Logger(RoundEngineService.name);
  private currentRound: Round | null = null;

  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepo: RoundRepository,
    private readonly gateway: GameGateway,
  ) {}

  async onModuleInit() {
    this.logger.log("Starting round engine...");
    setTimeout(() => this.startLoop(), 10_000);
  }

  private async startLoop() {
    while (true) {
      await this.runBettingPhase();
      await this.runGamePhase();
      await this.sleep(3000);
    }
  }

  private async runBettingPhase() {
    const round = Round.create(randomUUID());
    this.currentRound = round;
    await this.roundRepo.save(round);

    this.logger.log(`Betting phase started: round ${round.id}`);
    this.gateway.emitBettingStarted(round);

    const end = Date.now() + BETTING_PHASE_MS;
    while (Date.now() < end) {
      this.gateway.emitBettingTick(Math.ceil((end - Date.now()) / 1000));
      await this.sleep(1000);
    }
  }

  private async runGamePhase() {
    if (!this.currentRound) return;

    this.currentRound.start();
    await this.roundRepo.save(this.currentRound);
    this.gateway.emitRoundStarted(this.currentRound);
    this.logger.log(`Round started: ${this.currentRound.id} — crash at ${this.currentRound.crashPoint.multiplier}x`);

    while (!this.currentRound.shouldCrash()) {
      const multiplier = this.currentRound.getCurrentMultiplier();
      this.gateway.emitMultiplierTick(multiplier);
      await this.sleep(TICK_MS);
    }

    // Reload from DB to get bets placed during betting phase
    const roundWithBets = await this.roundRepo.findById(this.currentRound.id);
    if (roundWithBets) this.currentRound = roundWithBets;

    this.currentRound.crash();
    await this.roundRepo.save(this.currentRound);
    this.gateway.emitRoundCrashed(this.currentRound);
    this.logger.log(`Round crashed at ${this.currentRound.crashPoint.multiplier}x`);
  }

  getCurrentRound(): Round | null {
    return this.currentRound;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
