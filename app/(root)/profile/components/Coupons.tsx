"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Copy, CopyCheck, Loader2 } from "lucide-react";

// Define type for discount data
interface IDiscount {
  _id: string;
  name: string;
  description: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  targetType: "category";
  parentCategory: {
    _id: string;
    name: string;
    isActive: boolean;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Coupons = () => {
  const [discounts, setDiscounts] = useState<IDiscount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/discounts?public=true");
        const data = await response.json();

        if (data.success) {
          setDiscounts(
            data.data.filter((discount: IDiscount) => discount.isActive)
          );
        } else {
          setError(data.error || "Failed to fetch discounts");
        }
      } catch (err) {
        setError("An error occurred while fetching discounts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  // Handle copying to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);

      const timeoutId = setTimeout(() => {
        setCopiedId(null);
      }, 2000);

      // Clean up the timeout if the component unmounts
      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Generate discount description based on type and value
  const getDiscountDescription = (discount: IDiscount) => {
    if (discount.description && discount.description.trim() !== "") {
      return discount.description;
    }

    const categoryName = discount.parentCategory?.name || "selected items";

    if (discount.discountType === "percentage") {
      return `Get ${discount.discountValue}% off on ${categoryName} (price inclusive of discount)`;
    } else {
      return `Get ₹${discount.discountValue} off on ${categoryName} (price inclusive of discount)`;
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className="h4">Available Coupons</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="mt-6 text-center text-red-500">{error}</div>
      ) : discounts.length === 0 ? (
        <div className="mt-6 text-center">No active coupons available</div>
      ) : (
        <div className="border rounded mt-6">
          {discounts.map((discount) => (
            <div key={discount._id} className="border p-6 flex justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(discount.name, discount._id)}
                    className="text-brand font-semibold cursor-pointer hover:underline focus:outline-none flex items-center"
                    title="Click to copy code"
                  >
                    {discount.name}
                    {copiedId === discount._id ? (
                      <span className="text-green-500 ml-2">
                        <CopyCheck className="size-4" />
                      </span>
                    ) : (
                      <span className="text-gray-400 ml-2">
                        <Copy className="size-4" />
                      </span>
                    )}
                  </button>
                </div>
                <p>{getDiscountDescription(discount)}</p>
              </div>
              <div className="flex flex-col items-end justify-end">
                <p>Valid till {formatDate(discount.endDate)}</p>
                <p className="text-blue-500">View T&C</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Coupons;
