import { Entity, Column, CreateDateColumn, PrimaryColumn } from "typeorm";

@Entity("wallets")
export class WalletOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "player_id", type: "uuid", unique: true })
  playerId!: string;

  @Column({ name: "balance_cents", type: "bigint" })
  balanceCents!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
