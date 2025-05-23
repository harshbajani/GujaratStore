import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/lib/actions/files.actions";

export async function GET(request: NextRequest, { params }: RouteParams) {
  const id = (await params).id;
  try {
    const file = await getFileById(id);

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
