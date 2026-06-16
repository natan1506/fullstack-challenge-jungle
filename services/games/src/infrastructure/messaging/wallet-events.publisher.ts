import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqplib from "amqplib";

export const WALLET_EXCHANGE = "wallet.events";

@Injectable()
export class WalletEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WalletEventsPublisher.name);
  private connection!: amqplib.Connection;
  private channel!: amqplib.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.connection = await amqplib.connect(this.config.getOrThrow("RABBITMQ_URL"));
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(WALLET_EXCHANGE, "topic", { durable: true });
    this.logger.log("WalletEventsPublisher connected to RabbitMQ");
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async publishDebitRequest(payload: { betId: string; playerId: string; amountCents: string }) {
    this.channel.publish(
      WALLET_EXCHANGE,
      "wallet.debit.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }

  async publishCreditRequest(payload: { betId: string; playerId: string; amountCents: string }) {
    this.channel.publish(
      WALLET_EXCHANGE,
      "wallet.credit.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }
}
