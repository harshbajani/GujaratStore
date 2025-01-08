import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket: GridFSBucket;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    throw new Error("Missing MongoDB URL");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);

    // Initialize GridFS bucket
    if (!conn.connection.db) {
      throw new Error("Database connection failed");
    }
    bucket = new GridFSBucket(conn.connection.db, {
      bucketName: "uploads",
    });

    console.log("MongoDB connected successfully");
    return { bucket };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
