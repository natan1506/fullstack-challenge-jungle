import { createHash } from "crypto";
import { Body, Controller, Get, Inject, Param, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import { PlaceBetUseCase } from "../../application/use-cases/place-bet.use-case";
import { CashOutUseCase } from "../../application/use-cases/cash-out.use-case";
import { RoundEngineService } from "../../application/services/round-engine.service";
import { ROUND_REPOSITORY } from "../../domain/round/repositories/round.repository";
import type { RoundRepository } from "../../domain/round/repositories/round.repository";
import { BET_REPOSITORY } from "../../domain/round/repositories/bet.repository";
import type { BetRepository } from "../../domain/round/repositories/bet.repository";
import { CrashPoint } from "../../domain/round/value-objects/crash-point.vo";

class PlaceBetDto {
  @IsNumber()
  @Min(100)
  @Max(100000)
  @Type(() => Number)
  amountCents!: number;
}

@ApiTags("games")
@Controller()
export class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
    private readonly roundEngine: RoundEngineService,
    @Inject(ROUND_REPOSITORY) private readonly roundRepo: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepo: BetRepository,
  ) {}

  @Get("health")
  health() {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  @ApiOperation({ summary: "Estado da rodada atual" })
  async getCurrent() {
    const round = this.roundEngine.getCurrentRound();
    if (!round) return null;
    return {
      id: round.id,
      status: round.status,
      multiplier: round.getCurrentMultiplier(),
      serverSeedHash: createHash("sha256").update(round.serverSeed).digest("hex"),
      bets: round.bets.map((b) => ({
        id: b.id,
        username: b.username,
        amountCents: b.amountCents.toString(),
        status: b.status,
        cashOutMultiplier: b.cashOutMultiplier,
      })),
    };
  }

  @Get("rounds/history")
  @ApiOperation({ summary: "Histórico de rodadas" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async getHistory(@Query("page") page = 1, @Query("limit") limit = 20) {
    const { rounds, total } = await this.roundRepo.findHistory(+page, +limit);
    return {
      data: rounds.map((r) => ({
        id: r.id,
        crashPoint: r.crashPoint.multiplier,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total,
      page: +page,
    };
  }

  @Get("rounds/:roundId/verify")
  @ApiOperation({ summary: "Verificação provably fair" })
  async verify(@Param("roundId") roundId: string) {
    const round = await this.roundRepo.findById(roundId);
    if (!round) return { error: "Round not found" };
    return {
      roundId: round.id,
      serverSeed: round.serverSeed,
      crashPoint: round.crashPoint.multiplier,
      verified: CrashPoint.verify(round.serverSeed, round.id, round.crashPoint.multiplier),
    };
  }

  @Get("bets/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Histórico de apostas do jogador" })
  async getMyBets(@Request() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    const { bets, total } = await this.betRepo.findByPlayer(req.user.playerId, +page, +limit);
    return {
      data: bets.map((b) => ({
        id: b.id,
        roundId: b.roundId,
        amountCents: b.amountCents.toString(),
        status: b.status,
        cashOutMultiplier: b.cashOutMultiplier,
        payoutCents: b.payoutCents?.toString() ?? null,
        createdAt: b.createdAt,
      })),
      total,
    };
  }

  @Post("bet")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fazer aposta" })
  async placeBet(@Request() req: any, @Body() dto: PlaceBetDto) {
    const bet = await this.placeBetUseCase.execute(
      req.user.playerId,
      req.user.username,
      BigInt(dto.amountCents),
    );
    return {
      id: bet.id,
      roundId: bet.roundId,
      amountCents: bet.amountCents.toString(),
      status: bet.status,
    };
  }

  @Post("bet/cashout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sacar" })
  async cashOut(@Request() req: any) {
    const bet = await this.cashOutUseCase.execute(req.user.playerId);
    return {
      id: bet.id,
      cashOutMultiplier: bet.cashOutMultiplier,
      payoutCents: bet.payoutCents?.toString(),
    };
  }
}
