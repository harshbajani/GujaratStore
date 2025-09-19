import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Gift } from "lucide-react";
import { getDeliveryStatusInfo } from "@/lib/utils/deliveryCharges";

interface FreeDeliveryIndicatorProps {
  subtotal: number;
  originalDeliveryCharges: number;
  className?: string;
}

const FreeDeliveryIndicator: React.FC<FreeDeliveryIndicatorProps> = ({
  subtotal,
  originalDeliveryCharges,
  className = "",
}) => {
  const deliveryInfo = getDeliveryStatusInfo(subtotal, originalDeliveryCharges);

  // Don't show if there are no delivery charges anyway
  if (originalDeliveryCharges === 0) {
    return null;
  }

  const progressPercentage = deliveryInfo.isFree
    ? 100
    : (subtotal / deliveryInfo.threshold) * 100;

  return (
    <Card
      className={`border-2 ${
        deliveryInfo.isFree
          ? "border-green-200 bg-green-50"
          : "border-blue-200 bg-blue-50"
      } ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {deliveryInfo.isFree ? (
            <Gift className="text-green-600" size={20} />
          ) : (
            <Truck className="text-blue-600" size={20} />
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`font-medium ${
                  deliveryInfo.isFree ? "text-green-800" : "text-blue-800"
                }`}
              >
                {deliveryInfo.message}
              </span>

              {deliveryInfo.isFree && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 hover:bg-green-100"
                >
                  FREE
                </Badge>
              )}
            </div>

            {!deliveryInfo.isFree && (
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  <span>₹{deliveryInfo.threshold.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {deliveryInfo.isFree ? (
          <p className="text-sm text-green-700">
            🎉 Congratulations! You&apos;ve saved ₹{originalDeliveryCharges} on
            delivery charges.
          </p>
        ) : (
          <p className="text-sm text-blue-700">
            Add ₹{deliveryInfo.amountNeeded.toLocaleString("en-IN")} more to
            your cart to get free delivery!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FreeDeliveryIndicator;
