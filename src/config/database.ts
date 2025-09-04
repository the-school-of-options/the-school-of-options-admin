import mongoose from "mongoose";

export async function connectDB(uri: string) {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    const { host, name } = mongoose.connection;
    console.log(`MongoDB connected: ${host}/${name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

