import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWallet1781444054693 implements MigrationInterface {
    name = 'CreateWallet1781444054693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL, "player_id" uuid NOT NULL, "balance_cents" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e186e455795c7fe799305c7185f" UNIQUE ("player_id"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "wallets"`);
    }

}
