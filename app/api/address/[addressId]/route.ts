import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { IAddress } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    // Connect to your MongoDB database
    const { addressId } = await params;
    await connectToDB();

    // Find the user that has an address with the given ID
    const user = await User.findOne({ "addresses._id": addressId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      );
    }

    // Find the specific address in the user's addresses array
    const address = user.addresses.find(
      (addr: IAddress) => addr._id?.toString() === addressId
    );

    if (!address) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      );
    }

    // Return the address in a JSON response
    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch shipping address" },
      { status: 500 }
    );
  }
}
