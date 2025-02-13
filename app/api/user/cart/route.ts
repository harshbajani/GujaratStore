import { NextResponse } from "next/server";
import { addToCart, removeFromCart } from "@/lib/actions/user.actions";

export async function POST(request: Request) {
  const { productId } = await request.json();
  const result = await addToCart(productId);
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { productId } = await request.json();
  const result = await removeFromCart(productId);
  return NextResponse.json(result);
}
