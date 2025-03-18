import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const OrderConfirmationDialog = ({
  isOpen,
  onClose,
  orderId,
}: OrderConfirmationDialogProps) => {
  const router = useRouter();

  const handleContinueShopping = () => {
    onClose();
    router.push("/shop");
  };

  const handleViewOrderSummary = () => {
    onClose();
    router.push(`/order-summary/${orderId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Order Confirmed!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <Image
            src="/order-successfull.png"
            alt="Order Successful"
            width={500}
            height={500}
            className="mx-auto w-full h-full"
          />
          <p className="text-center text-gray-600">
            Your order has been successfully placed. Thank you for shopping with
            us!
          </p>
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
          <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
            <Button
              onClick={handleContinueShopping}
              variant="outline"
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={handleViewOrderSummary}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              View Order Summary
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
