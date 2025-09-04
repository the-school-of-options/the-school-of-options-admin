import mongoose, { Schema, Types } from "mongoose";

export interface ISubscriber {
  _id?: Types.ObjectId;
  email: string;
  fullName?: string;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
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
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

// userSchema.index({ email: 1 });
// userSchema.index({ cognitoId: 1 });
// userSchema.index({ role: 1 });

const Subscriber = mongoose.model<ISubscriber>("subscriber", subscriberSchema);

export default Subscriber;
