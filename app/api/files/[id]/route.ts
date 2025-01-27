import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/lib/actions/blog.actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const file = await getFileById(params.id);

    return new NextResponse(file.buffer, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error retrieving file" },
      { status: 500 }
    );
  }
}
