import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { IUser } from "@/types";

interface RewardRedemptionProps {
  userData: IUser | null;
  pointsToRedeem: number;
  setPointsToRedeem: (points: number) => void;
  handleRedeemRewardPoints: () => void;
  rewardDiscountAmount: number;
  loadingRewardRedemption: boolean;
}

export function RewardRedemptionComponent({
  userData,
  pointsToRedeem,
  setPointsToRedeem,
  handleRedeemRewardPoints,
  rewardDiscountAmount,
  loadingRewardRedemption,
}: RewardRedemptionProps) {
  const [error, setError] = useState<string>("");

  const handlePointsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    const maxPoints = userData?.rewardPoints || 0;

    if (value > maxPoints) {
      setError(`You only have ${maxPoints} points available`);
    } else if (value < 0) {
      setError("Points cannot be negative");
    } else {
      setError("");
    }

    setPointsToRedeem(value);
  };

  // Remove the condition that checks for userData.referral
  if (!userData) {
    return null;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md mt-4">
      <h3 className="text-lg font-medium mb-2">Reward Points</h3>

      <div className="flex items-center mb-2">
        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
          Available: {userData.rewardPoints || 0} points
        </div>
        {rewardDiscountAmount > 0 && (
          <div className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
            Applied: ₹{rewardDiscountAmount} discount
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">
          You can redeem your reward points for a discount (10 points = ₹1)
        </p>

        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={userData.rewardPoints || 0}
            value={pointsToRedeem || ""}
            onChange={handlePointsChange}
            placeholder="Enter points to redeem"
            className="flex-1"
          />
          <Button
            onClick={handleRedeemRewardPoints}
            disabled={
              pointsToRedeem <= 0 ||
              pointsToRedeem > (userData.rewardPoints || 0) ||
              loadingRewardRedemption ||
              Boolean(error)
            }
            variant="default"
            className="primary-btn"
          >
            {loadingRewardRedemption ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redeeming...
              </>
            ) : (
              "Redeem Points"
            )}
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        {pointsToRedeem > 0 && !error && (
          <p className="text-sm text-gray-600">
            Redeeming {pointsToRedeem} points will give you a discount of ₹
            {Math.floor(pointsToRedeem / 10)}
          </p>
        )}
      </div>
    </div>
  );
}
