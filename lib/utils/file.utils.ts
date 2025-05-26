import { connectToDB } from "../mongodb";
import { ObjectId } from "mongodb";

export interface FileResponse {
  buffer: Buffer;
  contentType: string;
}

export async function getFileById(id: string): Promise<FileResponse> {
  try {
    const { bucket } = await connectToDB();

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid file ID");
    }

    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    if (!files.length) {
      throw new Error("File not found");
    }

    const chunks: Buffer[] = [];
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));

    return new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      downloadStream.on("error", reject);
      downloadStream.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: files[0].contentType || "application/octet-stream",
        })
      );
    });
  } catch (error) {
    console.error("File retrieval error:", error);
    throw error;
  }
}

export async function deleteFileById(id: string): Promise<void> {
  try {
    const { bucket } = await connectToDB();

    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid file ID");
    }

    await bucket.delete(new ObjectId(id));
  } catch (error) {
    console.error("File deletion error:", error);
    throw error;
  }
}
