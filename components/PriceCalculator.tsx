"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IPriceCalculatorProps } from "@/types";

const PriceCalculator = ({ control }: IPriceCalculatorProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-6">
        <FormField
          control={control}
          name="mrp"
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
          name="landingPrice"
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
          name="discountType"
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
          name="discountValue"
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
          name="gstRate"
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
          name="gstAmount"
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
          name="netPrice"
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
          name="deliveryCharges"
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
          name="deliveryDays"
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
  );
};

export default PriceCalculator;
