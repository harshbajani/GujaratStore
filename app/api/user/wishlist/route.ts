import { NextResponse } from "next/server";
import { addToWishlist, removeFromWishlist } from "@/lib/actions/user.actions";

export async function POST(request: Request) {
  const { productId } = await request.json();

  const result = await addToWishlist(productId);
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { productId } = await request.json();
  const result = await removeFromWishlist(productId);
  return NextResponse.json(result);
}
