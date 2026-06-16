import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { validate } from "./infrastructure/config/env.validation";
import { WalletModule } from "./modules/wallet.module";
import { AuthModule } from "./infrastructure/auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    DatabaseModule,
    AuthModule,
    WalletModule,
  ],
})
export class AppModule {}
