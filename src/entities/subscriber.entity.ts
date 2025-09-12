import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, BaseEntity, EventSubscriber, EntitySubscriberInterface } from 'typeorm';

@Entity('subscribers')
export class Subscribers extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email!: string;

//   @Column({ type: 'varchar', length: 160, nullable: true })
//   name!: string | null;

  @Column({ type: 'boolean', default: true })
  subscribed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@EventSubscriber()
export class SubscriberSubscriber implements EntitySubscriberInterface<Subscribers> {
  listenTo() {
    return Subscribers;
  }

}