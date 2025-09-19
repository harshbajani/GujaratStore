/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFieldArray, Control, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { ComboBox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PriceCalculator from "@/components/PriceCalculator";

interface SizePricingProps {
  control: Control<IProduct> | Control<any>;
  sizes: ISizes[];
  onPricingModeChange?: (isSizeBased: boolean) => void;
  setValue?: any;
}

const SizePricing: React.FC<SizePricingProps> = ({
  control,
  sizes,
  onPricingModeChange,
  setValue,
}) => {
  const [isSizeBasedPricing, setIsSizeBasedPricing] = useState(false);

  const { fields, append, remove, replace } = useFieldArray({
    control: control,
    name: "productSize",
  });

  // Watch for existing productSize data to auto-enable size-based pricing
  const existingProductSizes = useWatch({
    control,
    name: "productSize",
    defaultValue: [],
  });

  // Auto-enable size-based pricing if there's existing size data
  useEffect(() => {
    if (existingProductSizes && existingProductSizes.length > 0 && !isSizeBasedPricing) {
      setIsSizeBasedPricing(true);
      if (onPricingModeChange) {
        onPricingModeChange(true);
      }
    }
  }, [existingProductSizes, isSizeBasedPricing, onPricingModeChange]);

  // Handle pricing mode toggle
  const handlePricingModeChange = (enabled: boolean) => {
    setIsSizeBasedPricing(enabled);
    if (onPricingModeChange) {
      onPricingModeChange(enabled);
    }

    // Clear product sizes when switching modes
    if (!enabled) {
      replace([]);
    }
  };

  // Available sizes that haven't been added yet
  const availableSizes = useMemo(() => {
    const usedSizeIds = fields.map((field) => (field as any).sizeId);
    return sizes.filter((size) => !usedSizeIds.includes(size._id || ""));
  }, [sizes, fields]);

  // Add new size pricing entry
  const addSizePrice = () => {
    if (availableSizes.length > 0) {
      append({
        sizeId: "",
        mrp: 0,
        landingPrice: 0,
        discountType: "percentage",
        discountValue: 0,
        gstType: "exclusive",
        gstRate: 0,
        gstAmount: 0,
        netPrice: 0,
        deliveryCharges: 0,
        deliveryDays: 0,
        quantity: 0,
      } as any);
    }
  };


  return (
    <div className="space-y-6">
      {/* Pricing Mode Toggle */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="size-based-pricing"
              checked={isSizeBasedPricing}
              onCheckedChange={handlePricingModeChange}
            />
            <Label htmlFor="size-based-pricing" className="text-sm font-medium">
              Enable Size-based Pricing
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isSizeBasedPricing
              ? "Configure different prices for each size variant"
              : "Use standard pricing for all sizes"}
          </p>
        </CardContent>
      </Card>

      {/* Standard Pricing Calculator */}
      {!isSizeBasedPricing && <PriceCalculator control={control} />}

      {/* Size-based Pricing */}
      {isSizeBasedPricing && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Size-based Pricing
              <Button
                type="button"
                onClick={addSizePrice}
                disabled={availableSizes.length === 0}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Size
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No sizes added yet. Click &apos;Add Size&apos; to get started.
              </p>
            )}

            {fields.map((field, index) => {
              return (
                <SizePriceRow
                  key={field.id}
                  control={control}
                  index={index}
                  availableSizes={availableSizes}
                  sizes={sizes}
                  onRemove={() => remove(index)}
                  setValue={setValue}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface SizePriceRowProps {
  control: Control<IProduct> | Control<any>;
  index: number;
  availableSizes: ISizes[];
  sizes: ISizes[];
  onRemove: () => void;
  setValue?: any;
}

const SizePriceRow: React.FC<SizePriceRowProps> = ({
  control,
  index,
  availableSizes,
  sizes,
  onRemove,
  setValue,
}) => {
  // Watch values for automatic calculation - exactly like the original form
  const mrp = useWatch({
    control,
    name: `productSize.${index}.mrp`,
    defaultValue: 0,
  });
  const discountType = useWatch({
    control,
    name: `productSize.${index}.discountType`,
    defaultValue: "percentage",
  });
  const discountValue = useWatch({
    control,
    name: `productSize.${index}.discountValue`,
    defaultValue: 0,
  });
  const gstType = useWatch({
    control,
    name: `productSize.${index}.gstType`,
    defaultValue: "exclusive",
  });
  const gstRate = useWatch({
    control,
    name: `productSize.${index}.gstRate`,
    defaultValue: 0,
  });

  // Automatic calculation effect - exactly like the original form
  useEffect(() => {
    if (!setValue) return; // Early return if setValue is not available
    
    const discountedBase =
      discountType === "percentage"
        ? mrp - mrp * (discountValue / 100)
        : mrp - discountValue;

    const safeDiscountedBase = Math.max(discountedBase || 0, 0);
    
    if (gstType === "inclusive") {
      const gstAmountInclusive =
        (safeDiscountedBase * (gstRate || 0)) / (100 + (gstRate || 0));
      
      // Use setValue for proper form updates
      setValue(`productSize.${index}.gstAmount`, gstAmountInclusive);
      setValue(`productSize.${index}.netPrice`, safeDiscountedBase);
    } else {
      const calculatedGstAmount = ((mrp || 0) * (gstRate || 0)) / 100;
      
      // Use setValue for proper form updates
      setValue(`productSize.${index}.gstAmount`, calculatedGstAmount);
      setValue(`productSize.${index}.netPrice`, safeDiscountedBase + calculatedGstAmount);
    }
  }, [mrp, discountType, discountValue, gstRate, gstType, setValue, index]);

  return (
    <Card className="border-l-4 border-l-brand/20">
      <CardContent className="pt-6">
        {/* Size Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField
            control={control}
            name={`productSize.${index}.sizeId`}
            render={({ field }) => {
              const currentSizeId = field.value;
              const currentSize = sizes.find((s) => s._id === currentSizeId);
              const options = currentSize
                ? [currentSize, ...availableSizes]
                : availableSizes;

              return (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={options.map((size) => ({
                        value: size._id || "",
                        label: size.label,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select size..."
                      searchPlaceholder="Search sizes..."
                      emptyText="No sizes available."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          
          <FormField
            control={control}
            name={`productSize.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Pricing Calculator Fields - Exactly like original PriceCalculator */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <FormField
              control={control}
              name={`productSize.${index}.mrp`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>MRP</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.landingPrice`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Landing Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.discountType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Discount Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.discountValue`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Discount Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.gstRate`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>GST Rate</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.gstType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "exclusive"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">Exclusive</SelectItem>
                        <SelectItem value="inclusive">Inclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.gstAmount`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>GST Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      readOnly
                      {...field}
                      onChange={(e) => onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.netPrice`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Net Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      readOnly
                      {...field}
                      onChange={(e) => onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.deliveryCharges`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Delivery Charges</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`productSize.${index}.deliveryDays`}
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Delivery Time (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SizePricing;
