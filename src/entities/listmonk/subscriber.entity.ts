// src/entities/listmonk-subscriber.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "subscribers", schema: "public" })
export class ListmonkSubscriber {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text" })
  status!: string; // e.g. 'enabled' | 'disabled' | 'bounced' | 'unconfirmed'

  @Column({ type: "jsonb", nullable: true })
  attribs?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
