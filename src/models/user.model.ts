import mongoose, { Schema, Types } from "mongoose";

export interface IUser {
  _id?: Types.ObjectId;
  cognitoId?: string;
  email: string;
  fullName: string;
  googleId?: string;
  isGoogleAcc?: boolean;
  role: "admin" | "user";
  otp?: {
    code: string;
    expiresAt: Date;
    attempts: number;
    lastSentAt?: Date;
    verified: boolean;
    type: "email_verification" | "password_reset";
  };
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
}

const otpSchema = new Schema({
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
  lastSentAt: Date,
  verified: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ["email_verification", "password_reset", "login"],
    required: true,
  },
});

const userSchema = new Schema<IUser>(
  {
    cognitoId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    googleId: {
      type: String,
      sparse: true,
    },

    isGoogleAcc: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    otp: {
      type: otpSchema,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


const User = mongoose.model<IUser>("User", userSchema);

export default User;
