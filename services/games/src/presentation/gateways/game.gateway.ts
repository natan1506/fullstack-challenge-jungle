import { createHash } from "crypto";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Round } from "../../domain/round/entities/round.entity";

const BETTING_PHASE_MS = 20_000;

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  emitBettingStarted(round: Round) {
    this.server.emit("betting:started", {
      roundId: round.id,
      serverSeedHash: this.hashSeed(round.serverSeed),
      bettingEndsIn: BETTING_PHASE_MS / 1000,
    });
  }

  emitBettingTick(secondsLeft: number) {
    this.server.emit("betting:tick", { secondsLeft });
  }

  emitRoundStarted(round: Round) {
    this.server.emit("round:started", { roundId: round.id });
  }

  emitMultiplierTick(multiplier: number) {
    this.server.emit("round:tick", { multiplier });
  }

  emitRoundCrashed(round: Round) {
    this.server.emit("round:crashed", {
      roundId: round.id,
      crashPoint: round.crashPoint.multiplier,
      serverSeed: round.serverSeed,
      bets: round.bets.map((b) => ({
        id: b.id,
        playerId: b.playerId,
        username: b.username,
        status: b.status,
        amountCents: b.amountCents.toString(),
        payoutCents: b.payoutCents?.toString() ?? null,
        cashOutMultiplier: b.cashOutMultiplier,
      })),
    });
  }

  emitBetPlaced(bet: { id: string; playerId: string; username: string; amountCents: string }) {
    this.server.emit("bet:placed", bet);
  }

  emitCashOut(bet: { id: string; playerId: string; username: string; cashOutMultiplier: number; payoutCents: string }) {
    this.server.emit("bet:cashout", bet);
  }

  private hashSeed(seed: string): string {
    return createHash("sha256").update(seed).digest("hex");
  }
}
