import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Component for entering and applying discount codes
interface DiscountSectionProps {
  onApplyDiscount: () => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  discountAmount: number;
  discountInfo: string | null;
  loadingDiscount: boolean;
}

const DiscountSection = ({
  onApplyDiscount,
  discountCode,
  setDiscountCode,
  discountInfo,
  loadingDiscount,
}: DiscountSectionProps) => {
  return (
    <div className="bg-white p-4 rounded-md mb-4">
      <h2 className="font-semibold mb-2">APPLY DISCOUNT</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Enter discount code"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={onApplyDiscount}
          disabled={!discountCode || loadingDiscount}
          className="bg-red-600 hover:bg-red-700"
        >
          {loadingDiscount ? "Checking..." : "Apply"}
        </Button>
      </div>

      {discountInfo && (
        <div className="mt-2 text-green-600 text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          {discountInfo}
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
