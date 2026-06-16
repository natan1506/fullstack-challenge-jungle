import "reflect-metadata";
import { DataSource } from "typeorm";
import { RoundOrmEntity } from "./entities/round.orm-entity";
import { BetOrmEntity } from "./entities/bet.orm-entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [RoundOrmEntity, BetOrmEntity],
  migrations: ["src/infrastructure/database/migrations/*.ts"],
});
