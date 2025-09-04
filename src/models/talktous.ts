import mongoose, { Schema, Types } from "mongoose";

export interface ITalkToUs {
  _id?: Types.ObjectId;
  email: string;
  fullName?: string;
  mobileNumber: string;
}

const talkToUsSchema = new Schema<ITalkToUs>(
  {
    email: {
      type: String,
      required: true,
      unique: false,
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
    mobileNumber: {
      type: String,
      trim: true,
      maxlength: 14,
    },
  },
  {
    timestamps: true,
  }
);


const TalkToUs = mongoose.model<ITalkToUs>("TalkToUs", talkToUsSchema);

export default TalkToUs;
