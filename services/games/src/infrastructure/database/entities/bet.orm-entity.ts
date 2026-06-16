import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity("bets")
export class BetOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "round_id", type: "uuid" })
  roundId!: string;

  @Column({ name: "player_id", type: "uuid" })
  playerId!: string;


  @Column()
  username!: string;

  @Column({ name: "amount_cents", type: "bigint" })
  amountCents!: string;

  @Column()
  status!: string;

  @Column({ name: "cash_out_multiplier", type: "decimal", precision: 10, scale: 2, nullable: true })
  cashOutMultiplier!: string | null;

  @Column({ name: "payout_cents", type: "bigint", nullable: true })
  payoutCents!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne("RoundOrmEntity", "bets")
  @JoinColumn({ name: "round_id" })
  round!: any;
}
