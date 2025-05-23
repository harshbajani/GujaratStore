import { connectToDB } from "../mongodb";
import { ObjectId } from "mongodb";

export async function getFileById(id: string) {
  try {
    const { bucket } = await connectToDB();

    const fileId = new ObjectId(id);

    // Get file info
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) {
      throw new Error("File not found");
    }

    const file = files[0];

    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file details and buffer
    return {
      buffer,
      _id: file._id,
      contentType: file.contentType || "application/octet-stream",
      filename: file.filename,
    };
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw new Error("Failed to retrieve file");
  }
}
