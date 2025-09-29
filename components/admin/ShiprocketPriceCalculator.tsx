/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, Truck, IndianRupee, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ShiprocketPriceCalculatorProps {
  order: IOrder;
  address: any;
}

interface RateResponse {
  courier_name: string;
  rate: number;
  estimated_delivery_date: string;
  cod_charges?: number;
  fuel_surcharge?: number;
  total_rate: number;
}

interface CalculatorState {
  isLoading: boolean;
  rates: RateResponse[];
  selectedCourier: string | null;
  error: string | null;
  cod_enabled: boolean;
}

const ShiprocketPriceCalculator: React.FC<ShiprocketPriceCalculatorProps> = ({
  order,
  address,
}) => {
  const [calculator, setCalculator] = useState<CalculatorState>({
    isLoading: false,
    rates: [],
    selectedCourier: null,
    error: null,
    cod_enabled: order.paymentOption === "cash-on-delivery",
  });

  const calculateShippingRates = async () => {
    if (!address) {
      toast({
        title: "Error",
        description: "Address information is missing",
        variant: "destructive",
      });
      return;
    }

    setCalculator((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Calculate total weight and dimensions from order items
      let totalWeight = 0;
      let maxLength = 10;
      let maxWidth = 10;
      let maxHeight = 10;

      order.items.forEach((item) => {
        const itemWeight = item.appliedWeight || item.deadWeight || 0.5;
        totalWeight += item.quantity * itemWeight;

        if (item.dimensions) {
          maxLength = Math.max(maxLength, item.dimensions.length || 10);
          maxWidth = Math.max(maxWidth, item.dimensions.width || 10);
          maxHeight = Math.max(maxHeight, item.dimensions.height || 10);
        }
      });

      // Ensure minimum weight
      totalWeight = Math.max(totalWeight, 0.5);

      const requestData = {
        pickup_postcode: process.env.NEXT_PUBLIC_ADMIN_PINCODE || "390020", // Admin/Default pincode
        delivery_postcode: address.pincode,
        weight: totalWeight,
        length: Math.round(maxLength),
        breadth: Math.round(maxWidth),
        height: Math.round(maxHeight),
        cod: calculator.cod_enabled ? 1 : 0,
        declared_value: order.total,
      };

      const response = await fetch("/api/admin/shiprocket/calculate-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success && data.rates) {
        setCalculator((prev) => ({
          ...prev,
          rates: data.rates,
          isLoading: false,
        }));
      } else {
        throw new Error(data.error || "Failed to calculate shipping rates");
      }
    } catch (error) {
      console.error("Error calculating shipping rates:", error);
      setCalculator((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to calculate rates",
        isLoading: false,
      }));

      toast({
        title: "Error",
        description: "Failed to calculate shipping rates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Shiprocket Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calculator Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cod_enabled"
              checked={calculator.cod_enabled}
              onChange={(e) =>
                setCalculator((prev) => ({
                  ...prev,
                  cod_enabled: e.target.checked,
                }))
              }
              className="rounded"
            />
            <Label htmlFor="cod_enabled" className="text-sm">
              Cash on Delivery
            </Label>
          </div>
          <Button
            onClick={calculateShippingRates}
            disabled={calculator.isLoading}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {calculator.isLoading ? "Calculating..." : "Calculate Rates"}
          </Button>
        </div>

        {/* Package Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Weight:</span>{" "}
              {order.items
                .reduce((weight, item) => {
                  const itemWeight =
                    item.appliedWeight || item.deadWeight || 0.5;
                  return weight + item.quantity * itemWeight;
                }, 0)
                .toFixed(2)}{" "}
              kg
            </div>
            <div>
              <span className="text-gray-600">Items:</span> {order.items.length}
            </div>
            <div>
              <span className="text-gray-600">Value:</span>{" "}
              {formatCurrency(order.total)}
            </div>
            <div>
              <span className="text-gray-600">Delivery:</span>{" "}
              {address?.pincode}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {calculator.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{calculator.error}</p>
          </div>
        )}

        {/* Rates Display */}
        {calculator.rates.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Available Shipping Options
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {calculator.rates.map((rate, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    calculator.selectedCourier === rate.courier_name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setCalculator((prev) => ({
                      ...prev,
                      selectedCourier: rate.courier_name,
                    }))
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {rate.courier_name}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Delivery by: {formatDate(rate.estimated_delivery_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {rate.total_rate.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Rate Breakdown */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Base Rate:</span>
                      <span>₹{rate.rate.toFixed(2)}</span>
                    </div>
                    {rate.cod_charges && rate.cod_charges > 0 && (
                      <div className="flex justify-between">
                        <span>COD Charges:</span>
                        <span>₹{rate.cod_charges.toFixed(2)}</span>
                      </div>
                    )}
                    {rate.fuel_surcharge && rate.fuel_surcharge > 0 && (
                      <div className="flex justify-between">
                        <span>Fuel Surcharge:</span>
                        <span>₹{rate.fuel_surcharge.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {calculator.selectedCourier && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">
                  Selected: {calculator.selectedCourier}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  This rate can be used for shipping cost estimation.
                </p>
              </div>
            )}
          </div>
        )}

        {!calculator.isLoading &&
          calculator.rates.length === 0 &&
          !calculator.error && (
            <div className="text-center py-6 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Click &quot;Calculate Rates&quot; to see shipping options</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default ShiprocketPriceCalculator;
