import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const { bucket } = await connectToDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a readable stream from the buffer
    const readableStream = Readable.from(buffer);

    // Create unique filename
    const filename = `${Date.now()}-${file.name}`;

    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.type,
    });

    // Promise to handle stream completion
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });
      uploadStream.on("error", reject);
    });

    // Pipe the readable stream to the upload stream
    readableStream.pipe(uploadStream);

    // Wait for upload to complete
    const fileId = await uploadPromise;

    return NextResponse.json({
      fileId: fileId.toString(),
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
