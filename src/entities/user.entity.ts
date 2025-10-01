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
  ADMIN = "admin",
  USER = "user",
}

export enum OtpType {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  LOGIN = "login",
}

@Check("CHK_user_fullname_len", 'char_length("fullName") <= 100')
@Check("CHK_user_otp_attempts", '"otpAttempts" <= 5 OR "otpAttempts" IS NULL')
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

  // Flattened OTP columns (instead of embedded)
  @Column({ type: "varchar", length: 64, nullable: true })
  otpCode?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  otpExpiresAt?: Date | null;

  @Column({ type: "smallint", default: 0, nullable: true })
  otpAttempts?: number | null;

  @Column({ type: "timestamptz", nullable: true })
  otpLastSentAt?: Date | null;

  @Column({ type: "boolean", default: false, nullable: true })
  otpVerified?: boolean | null;

  @Column({
    type: "enum",
    enum: OtpType,
    enumName: "otp_type_enum",
    nullable: true,
  })
  otpType?: OtpType | null;

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

  @BeforeInsert()
  @BeforeUpdate()
  normalize() {
    if (this.email) this.email = this.email.trim().toLowerCase();
    if (this.fullName) this.fullName = this.fullName.trim();
  }

  // Helper methods to work with OTP data as if it were embedded
  getOtp(): {
    code?: string | null;
    expiresAt?: Date | null;
    attempts?: number | null;
    lastSentAt?: Date | null;
    verified?: boolean | null;
    type?: OtpType | null;
  } {
    return {
      code: this.otpCode,
      expiresAt: this.otpExpiresAt,
      attempts: this.otpAttempts,
      lastSentAt: this.otpLastSentAt,
      verified: this.otpVerified,
      type: this.otpType,
    };
  }

  setOtp(otp: {
    code?: string | null;
    expiresAt?: Date | null;
    attempts?: number | null;
    lastSentAt?: Date | null;
    verified?: boolean | null;
    type?: OtpType | null;
  }) {
    this.otpCode = otp.code;
    this.otpExpiresAt = otp.expiresAt;
    this.otpAttempts = otp.attempts;
    this.otpLastSentAt = otp.lastSentAt;
    this.otpVerified = otp.verified;
    this.otpType = otp.type;
  }
}

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }
}