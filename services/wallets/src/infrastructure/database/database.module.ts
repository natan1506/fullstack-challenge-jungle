import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.getOrThrow<string>("DATABASE_URL"),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get("NODE_ENV") !== "production",
        migrations: ["src/infrastructure/database/migrations/*.ts"],
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
