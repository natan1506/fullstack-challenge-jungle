import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { BetOrmEntity } from "./bet.orm-entity";

@Entity("rounds")
export class RoundOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "server_seed" })
  serverSeed!: string;

  @Column({ name: "crash_point", type: "decimal", precision: 10, scale: 2 })
  crashPoint!: string;

  @Column()
  status!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt!: Date | null;

  @Column({ name: "crashed_at", type: "timestamptz", nullable: true })
  crashedAt!: Date | null;

  @OneToMany(() => BetOrmEntity, (bet) => bet.round, { cascade: true, eager: true })
  bets!: BetOrmEntity[];
}
