import mongoose, { Schema, Types } from "mongoose";
import { slugify } from "../utils/slug.js";
import { replaceInlineBase64Images, uploadBase64ToS3 } from "../utils/s3.js";

export interface IBlog {
  _id?: Types.ObjectId;
  title: string;
  content: string; // HTML
  status: "draft" | "published";
  sentAt?: Date;
  slug: string;
  readingTime: number;
  displayPicture: string; // URL or base64 on input
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    sentAt: { type: Date },
    slug: { type: String, required: true, unique: true, index: true },
    readingTime: { type: Number, required: true, default: 1, min: 1 },
    displayPicture: { type: String, required: true },
  },
  { timestamps: true }
);

blogSchema.pre("validate", async function (next) {
  try {
    const doc = this as mongoose.Document & IBlog;

    // Generate slug if missing or title modified
    if (!doc.slug || doc.isModified("title")) {
      const base = slugify(doc.title);
      let candidate = base;
      let i = 0;
      const Model = this.constructor as mongoose.Model<IBlog>;
      while (await Model.exists({ slug: candidate })) {
        i += 1;
        candidate = `${base}-${i}`;
      }
      doc.slug = candidate;
    }

    // Compute reading time (~200 wpm)
    if (doc.isModified("content") || doc.isNew) {
      const text = doc.content.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
      const words = (text.match(/\b\w+\b/g) || []).length;
      const minutes = Math.max(1, Math.ceil(words / 200));
      doc.readingTime = minutes;
    }

    next();
  } catch (e) {
    next(e as any);
  }
});

blogSchema.pre("save", async function (next) {
  try {
    const doc = this as mongoose.Document & IBlog;

    // Upload display picture if base64
    if (doc.isModified("displayPicture") && /^data:image\//.test(doc.displayPicture)) {
      const url = await uploadBase64ToS3(doc.displayPicture, { keyPrefix: "blogs/cover" });
      doc.displayPicture = url;
    }

    // Replace inline images in content from base64 to S3 URLs
    if (doc.isModified("content") && /src=["']data:image\//i.test(doc.content)) {
      doc.content = await replaceInlineBase64Images(doc.content, { keyPrefix: "blogs/content" });
    }

    next();
  } catch (e) {
    next(e as any);
  }
});

const Blog = mongoose.model<IBlog>("Blog", blogSchema);
export default Blog;

