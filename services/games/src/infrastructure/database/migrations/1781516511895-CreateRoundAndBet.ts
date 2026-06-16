import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoundAndBet1781516511895 implements MigrationInterface {
    name = 'CreateRoundAndBet1781516511895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bets" ("id" uuid NOT NULL, "round_id" uuid NOT NULL, "player_id" uuid NOT NULL, "username" character varying NOT NULL, "amount_cents" bigint NOT NULL, "status" character varying NOT NULL, "cash_out_multiplier" numeric(10,2), "payout_cents" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "roundId" uuid, CONSTRAINT "PK_7ca91a6a39623bd5c21722bcedd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rounds" ("id" uuid NOT NULL, "server_seed" character varying NOT NULL, "crash_point" numeric(10,2) NOT NULL, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "started_at" TIMESTAMP WITH TIME ZONE, "crashed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_9d254884a20817016e2f877c7e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bets" ADD CONSTRAINT "FK_8dd205775766a315a1b53f4a871" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bets" DROP CONSTRAINT "FK_8dd205775766a315a1b53f4a871"`);
        await queryRunner.query(`DROP TABLE "rounds"`);
        await queryRunner.query(`DROP TABLE "bets"`);
    }

}
