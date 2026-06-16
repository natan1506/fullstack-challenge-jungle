import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqplib from "amqplib";
import { WALLET_REPOSITORY } from "../../domain/wallet/repositories/wallet.repository";
import type { WalletRepository } from "../../domain/wallet/repositories/wallet.repository";
import { Money } from "../../domain/wallet/value-objects/money.vo";

const WALLET_EXCHANGE = "wallet.events";
const DLX = "wallet.events.dlx";

@Injectable()
export class WalletEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WalletEventsConsumer.name);
  private connection!: amqplib.Connection;
  private channel!: amqplib.Channel;

  // In-memory idempotency set — prevents double-processing if message is
  // re-delivered before ACK (e.g. consumer restart). Bounded to 10k entries.
  // Production: replace with a DB-backed processed_events table.
  private readonly processedIds = new Set<string>();

  constructor(
    private readonly config: ConfigService,
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: WalletRepository,
  ) {}

  async onModuleInit() {
    this.connection = await amqplib.connect(this.config.getOrThrow("RABBITMQ_URL"));
    this.channel = await this.connection.createChannel();
    this.channel.prefetch(1);

    // Dead-letter exchange receives nack'd messages for manual inspection
    await this.channel.assertExchange(DLX, "direct", { durable: true });
    await this.channel.assertQueue("wallet.debit.dlq", { durable: true });
    await this.channel.bindQueue("wallet.debit.dlq", DLX, "wallet.debit");
    await this.channel.assertQueue("wallet.credit.dlq", { durable: true });
    await this.channel.bindQueue("wallet.credit.dlq", DLX, "wallet.credit");

    await this.channel.assertExchange(WALLET_EXCHANGE, "topic", { durable: true });

    const debitQ = await this.channel.assertQueue("wallet.debit", {
      durable: true,
      arguments: { "x-dead-letter-exchange": DLX, "x-dead-letter-routing-key": "wallet.debit" },
    });
    await this.channel.bindQueue(debitQ.queue, WALLET_EXCHANGE, "wallet.debit.requested");
    this.channel.consume(debitQ.queue, (msg) => this.handleDebit(msg));

    const creditQ = await this.channel.assertQueue("wallet.credit", {
      durable: true,
      arguments: { "x-dead-letter-exchange": DLX, "x-dead-letter-routing-key": "wallet.credit" },
    });
    await this.channel.bindQueue(creditQ.queue, WALLET_EXCHANGE, "wallet.credit.requested");
    this.channel.consume(creditQ.queue, (msg) => this.handleCredit(msg));

    this.logger.log("WalletEventsConsumer listening (DLQ enabled)");
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  private async handleDebit(msg: amqplib.Message | null) {
    if (!msg) return;
    try {
      const { betId, playerId, amountCents } = JSON.parse(msg.content.toString());

      if (this.processedIds.has(`debit:${betId}`)) {
        this.logger.warn(`Duplicate debit for betId ${betId} — skipping`);
        this.channel.ack(msg);
        return;
      }

      const wallet = await this.walletRepo.findByPlayerId(playerId);
      if (!wallet) throw new Error(`Wallet not found for player ${playerId}`);
      wallet.debit(Money.of(BigInt(amountCents)));
      await this.walletRepo.save(wallet);

      this.processedIds.add(`debit:${betId}`);
      if (this.processedIds.size > 10_000) {
        const first = this.processedIds.values().next().value;
        if (first) this.processedIds.delete(first);
      }

      this.channel.ack(msg);
      this.logger.log(`Debited ${amountCents} from player ${playerId} (bet ${betId})`);
    } catch (err) {
      this.logger.error("Failed to process debit — routing to DLQ", err);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleCredit(msg: amqplib.Message | null) {
    if (!msg) return;
    try {
      const { betId, playerId, amountCents } = JSON.parse(msg.content.toString());

      if (this.processedIds.has(`credit:${betId}`)) {
        this.logger.warn(`Duplicate credit for betId ${betId} — skipping`);
        this.channel.ack(msg);
        return;
      }

      const wallet = await this.walletRepo.findByPlayerId(playerId);
      if (!wallet) throw new Error(`Wallet not found for player ${playerId}`);
      wallet.credit(Money.of(BigInt(amountCents)));
      await this.walletRepo.save(wallet);

      this.processedIds.add(`credit:${betId}`);
      if (this.processedIds.size > 10_000) {
        const first = this.processedIds.values().next().value;
        if (first) this.processedIds.delete(first);
      }

      this.channel.ack(msg);
      this.logger.log(`Credited ${amountCents} to player ${playerId} (bet ${betId})`);
    } catch (err) {
      this.logger.error("Failed to process credit — routing to DLQ", err);
      this.channel.nack(msg, false, false);
    }
  }
}
