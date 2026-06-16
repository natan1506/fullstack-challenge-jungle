import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "../../application/use-cases/get-wallet.use-case";
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WalletResponseDto } from "../dtos/create-wallet.dto";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import type { Request } from "express";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { status: "ok" };
  }
}

@ApiTags("wallets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Criar carteira para o jogador autenticado" })
  async create(@Req() req: Request & { user: { playerId: string } }): Promise<WalletResponseDto> {
    const wallet = await this.createWallet.execute(req.user.playerId);
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toDecimal(),
      createdAt: wallet.createdAt,
    };
  }

  @Get("me")
  @ApiOperation({ summary: "Retorna carteira e saldo do jogador" })
  async getMe(@Req() req: Request & { user: { playerId: string } }): Promise<WalletResponseDto> {
    const wallet = await this.getWallet.execute(req.user.playerId);
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toDecimal(),
      createdAt: wallet.createdAt,
    };
  }
}
