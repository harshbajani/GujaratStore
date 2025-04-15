// app/api/products/[id]/reviews/route.ts
import { connectToDB } from "@/lib/mongodb";
import ProductReviews from "@/lib/models/productReview.model";
import Products from "@/lib/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { RouteParams } from "@/types";

// Get all reviews for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const productId = (await params).id;

    const reviews = await ProductReviews.find({ productId })
      .sort({ date: -1 })
      .lean()
      .exec();

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      const rating = Math.round(
        review.rating
      ) as keyof typeof ratingDistribution;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add a new review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const productId = (await params).id;
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
      const { userId, userName, rating, comment } = await request.json();

      if (!userId || !rating || !comment) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Check if user already reviewed this product
      const existingReview = await ProductReviews.findOne({
        userId,
        productId,
      }).session(session);

      if (existingReview) {
        // Update existing review
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.date = new Date();
        await existingReview.save({ session });
      } else {
        // Create new review
        await ProductReviews.create(
          [
            {
              userId,
              productId,
              userName,
              rating,
              comment,
            },
          ],
          { session }
        );
      }

      // Update product rating (average of all reviews)
      const allReviews = await ProductReviews.find({ productId }).session(
        session
      );
      const averageRating =
        allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length;

      // Update product with new average rating and add review to productReviews array
      await Products.findByIdAndUpdate(
        productId,
        {
          productRating: parseFloat(averageRating.toFixed(1)),
          $addToSet: {
            productReviews:
              existingReview?._id || allReviews[allReviews.length - 1]._id,
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({
        success: true,
        message: existingReview
          ? "Review updated successfully"
          : "Review added successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error adding/updating review:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
