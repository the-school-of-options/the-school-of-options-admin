import mongoose, { Schema, Types } from "mongoose";

export interface INewsletter {
  _id?: Types.ObjectId;
  title: string;
  content: string; // HTML string
  status: "draft" | "published";
  sentAt?: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

const Newsletter = mongoose.model<INewsletter>("Newsletter", newsletterSchema);
export default Newsletter;

