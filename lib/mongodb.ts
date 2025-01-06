import mongoose from "mongoose";
import gridfsStream, { Grid } from "gridfs-stream";

let isConnected = false; // Track the connection status
let gfs: Grid | null = null; // GridFS instance

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    console.error("Missing MongoDB URL");
    throw new Error("Missing MongoDB URL");
  }

  if (isConnected) {
    console.log("MongoDB connection already established");
    return { gfs };
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URL);
    isConnected = true;
    console.log("MongoDB connected successfully");

    // Initialize GridFS
    const db = connection.connection.db;
    gfs = gridfsStream(db, mongoose.mongo);
    gfs.collection("uploads"); // Specify the collection name for GridFS

    return { gfs };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};
