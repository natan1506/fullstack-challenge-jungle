import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { GameModule } from "./modules/game.module";
import { validate } from "./infrastructure/config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    DatabaseModule,
    AuthModule,
    GameModule,
  ],
})
export class AppModule {}
