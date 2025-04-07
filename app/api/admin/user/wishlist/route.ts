import { NextResponse } from "next/server";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/lib/actions/admin/user.actions";
import Products from "@/lib/models/product.model";
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

interface UserDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: string;
  wishlist: mongoose.Types.ObjectId[];
  cart: mongoose.Types.ObjectId[];
  isVerified: boolean;
  __v: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "You must be logged in" },
        { status: 401 }
      );
    }

    await connectToDB();

    // Find the user and their wishlist
    const user = (await User.findOne({
      email: session.user.email,
    }).lean()) as UserDocument;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If wishlist is empty, return empty array
    if (!user.wishlist || user.wishlist.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch the product details for each item in the wishlist
    const wishlistItems = await Products.find(
      { _id: { $in: user.wishlist } },
      {
        productName: 1,
        productCoverImage: 1,
        mrp: 1,
        netPrice: 1,
        discountType: 1,
        discountValue: 1,
        productQuantity: 1,
        productStatus: 1,
      }
    ).lean();

    return NextResponse.json({ success: true, data: wishlistItems });
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wishlist items" },
      { status: 500 }
    );
  }
}

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
