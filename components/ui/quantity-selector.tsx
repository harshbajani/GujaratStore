"use client";

import { Button } from "@/components/ui/button";

function QuantitySelector({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}) {
  const increment = () => setQuantity((prev) => prev + 1);
  const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 0));

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={decrement}>
        -
      </Button>
      <div className="w-8 text-center">{quantity}</div>
      <Button variant="outline" onClick={increment}>
        +
      </Button>
    </div>
  );
}

export default QuantitySelector;
