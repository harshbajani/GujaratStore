"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PenLine, Star, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { IProductReview } from "@/types";

type Review = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

// A helper to create a date string like "26 Oct 2021"
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Calculate average rating from distribution
function getAverageRating(distribution: RatingDistribution): number {
  const totalReviews = Object.values(distribution).reduce(
    (acc, val) => acc + val,
    0
  );
  if (totalReviews === 0) return 0;

  const weightedSum = Object.entries(distribution).reduce(
    (acc, [rating, count]) => acc + parseInt(rating) * count,
    0
  );
  return weightedSum / totalReviews;
}

interface ReviewSectionProps {
  productId?: string;
  initialRating?: number;
  onStatsLoaded?: (stats: {
    totalReviews: number;
    averageRating: number;
  }) => void;
}

export default function ReviewSection({
  productId,
  initialRating = 0,
  onStatsLoaded,
}: ReviewSectionProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingDistribution, setRatingDistribution] =
    useState<RatingDistribution>({
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    });

  // Calculate average rating from distribution
  const averageRating = getAverageRating(ratingDistribution) || initialRating;
  // Sum of all reviews in distribution
  const totalReviewsFromDistribution = Object.values(ratingDistribution).reduce(
    (acc, val) => acc + val,
    0
  );

  // For the "Write a review" dialog
  const [isOpen, setIsOpen] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [tempComment, setTempComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews on component mount
  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  useEffect(() => {
    if (!loading && onStatsLoaded) {
      onStatsLoaded({
        totalReviews: totalReviewsFromDistribution,
        averageRating: averageRating,
      });
    }
  }, [loading, totalReviewsFromDistribution, averageRating, onStatsLoaded]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/reviews`);
      const data = await response.json();

      if (data.success) {
        setReviews(
          data.data.reviews.map((review: IProductReview) => ({
            ...review,
            date: formatDate(review.date),
          }))
        );
        setRatingDistribution(data.data.ratingDistribution);
      } else {
        toast({
          title: "Error",
          description: "Failed to load reviews",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      setIsOpen(false);
      return;
    }

    if (tempRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!tempComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a review comment",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name || "Anonymous User",
          rating: tempRating,
          comment: tempComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          className: "bg-green-500 text-white",
        });

        // Refetch reviews to update the list
        fetchReviews();

        // Reset fields
        setTempRating(0);
        setTempComment("");
        setIsOpen(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 border-t mt-4">
      {/* Ratings & Reviews Header */}
      <div className="flex items-center justify-between mt-4">
        <h2 className="text-xl font-semibold">Ratings & Reviews</h2>

        {/* "Write a review" button -> opens dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button
              className="text-red-500 hover:underline flex items-center gap-1"
              onClick={() => {
                if (status === "unauthenticated") {
                  toast({
                    title: "Authentication Required",
                    description: "Please log in to write a review",
                    variant: "destructive",
                  });
                  return;
                }
              }}
            >
              <PenLine className="h-4 w-4" />
              Write a review
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rate the product</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Please share your experience with this product.
              </DialogDescription>
            </DialogHeader>

            {/* Star Rating */}
            <div className="flex items-center gap-1 my-3">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((starIndex) => (
                <Star
                  key={starIndex}
                  className={cn(
                    "h-6 w-6 cursor-pointer",
                    starIndex <= tempRating
                      ? "fill-current text-yellow-500"
                      : "text-gray-400"
                  )}
                  onClick={() => setTempRating(starIndex)}
                />
              ))}
            </div>

            {/* Textarea for comment */}
            <Textarea
              placeholder="Please enter your review"
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              className="min-h-[100px] border-none bg-gray-100"
            />

            <DialogFooter className="flex items-center justify-center">
              <Button
                variant="default"
                onClick={handleSubmitReview}
                className="primary-btn w-full"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall rating summary */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Average rating & total */}
        <div className="flex flex-col items-center justify-center text-center">
          {loading ? (
            <Skeleton className="h-12 w-20 rounded-md" />
          ) : (
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          )}

          {/* Star row */}
          <div className="flex gap-1">
            {loading ? (
              <Skeleton className="h-6 w-32 rounded-md" />
            ) : (
              Array.from({ length: 5 }, (_, i) => i + 1).map((starIndex) => (
                <Star
                  key={starIndex}
                  className={cn(
                    "h-5 w-5",
                    starIndex <= Math.round(averageRating)
                      ? "fill-current text-yellow-500"
                      : "text-gray-300"
                  )}
                />
              ))
            )}
          </div>

          <p className="text-sm text-gray-500">
            {loading ? (
              <Skeleton className="h-4 w-20 rounded-md mt-1" />
            ) : (
              `${totalReviewsFromDistribution} reviews`
            )}
          </p>
        </div>

        {/* Rating distribution bars */}
        <div className="flex-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = ratingDistribution[star];
            const percentage = totalReviewsFromDistribution
              ? (count / totalReviewsFromDistribution) * 100
              : 0;

            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="w-4 text-right text-sm">{star}</span>
                {loading ? (
                  <Skeleton className="h-2 w-full rounded-md" />
                ) : (
                  <div className="relative flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="absolute left-0 top-0 h-2 bg-green-500 rounded"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                <span className="w-8 text-sm text-gray-600 text-right">
                  {loading ? (
                    <Skeleton className="h-4 w-6 rounded-md" />
                  ) : (
                    count
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List of Reviews */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">
          Customer Reviews ({loading ? "..." : reviews.length})
        </h3>

        <div className="space-y-4 mt-4">
          {loading ? (
            // Loading skeletons for reviews
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-6 w-12 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-4 w-48 rounded-md mt-2" />
              </div>
            ))
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="border-b pb-4">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <span className="font-medium text-white bg-green-600 rounded px-2">
                    {review.rating.toFixed(1)}
                  </span>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map(
                    (starIndex) => (
                      <Star
                        key={starIndex}
                        className={cn(
                          "h-4 w-4",
                          starIndex <= Math.round(review.rating)
                            ? "fill-current text-yellow-500"
                            : "text-gray-300"
                        )}
                      />
                    )
                  )}
                </div>
                {/* Comment */}
                <p className="text-gray-800">{review.comment}</p>
                {/* User info */}
                <p className="text-sm text-gray-500 mt-1">
                  {review.userName} | {review.date}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mb-2 text-gray-400" />
              <p className="text-center">
                No reviews yet. Be the first to leave a review!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
