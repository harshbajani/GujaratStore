import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket: GridFSBucket;

const opts = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 30_000,
  keepAlive: true,
  keepAliveInitialDelay: 300_000,
};

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    throw new Error("Missing MongoDB URL");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, opts);

    // Initialize GridFS bucket
    if (!conn.connection.db) {
      throw new Error("Database connection failed");
    }

    // Only create a new bucket if it doesn't exist
    if (!bucket) {
      bucket = new GridFSBucket(conn.connection.db, {
        bucketName: "uploads",
      });
    }

    console.log("MongoDB connected successfully");
    return { bucket };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
