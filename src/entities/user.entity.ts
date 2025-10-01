import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  Check,
  BaseEntity,
  EventSubscriber,
  EntitySubscriberInterface,
} from "typeorm";

export enum UserRole {
 SUPER_ADMIN = "Super-Admin",
  USER = "User",
}



@Check("CHK_user_fullname_len", 'char_length("fullName") <= 100')
@Entity({ name: "users" })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64, nullable: true, unique: true })
  cognitoId!: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 320, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  fullName: string;

  @Index()
  @Column({ type: "varchar", length: 128, nullable: true })
  googleId!: string | null;

  @Column({ type: "boolean", default: false })
  isGoogleAcc!: boolean;

  @Column({
    type: "enum",
    enum: UserRole,
    enumName: "user_role_enum",
    default: UserRole.USER,
  })
  role!: UserRole;





  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastLogin!: Date | null;

  @Column({ type: "integer", default: 0 })
  loginCount!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @Index()
  @Column({ type: "varchar", length: 20, nullable: true })
  mobileNumber!: string | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalize() {
    if (this.email) this.email = this.email.trim().toLowerCase();
    if (this.fullName) this.fullName = this.fullName.trim();
  }


}

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }
}