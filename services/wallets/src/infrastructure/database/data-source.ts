import "reflect-metadata";
import { DataSource } from "typeorm";
import { WalletOrmEntity } from "./entities/wallet.orm-entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [WalletOrmEntity],
  migrations: ["src/infrastructure/database/migrations/*.ts"],
});
