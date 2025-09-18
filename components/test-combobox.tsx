"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ComboBox, ComboBoxOption } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

// Test schema
const testSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  size: z.string().min(1, "Please select a size"),
});

type TestFormData = z.infer<typeof testSchema>;

// Mock data to test with large datasets
const mockCategories: ComboBoxOption[] = Array.from({ length: 100 }, (_, i) => ({
  value: `category-${i + 1}`,
  label: `Category ${i + 1}`,
  disabled: i % 10 === 0, // Disable every 10th option for testing
}));

const mockSizes: ComboBoxOption[] = [
  { value: "xs", label: "Extra Small (XS)" },
  { value: "s", label: "Small (S)" },
  { value: "m", label: "Medium (M)" },
  { value: "l", label: "Large (L)" },
  { value: "xl", label: "Extra Large (XL)" },
  { value: "xxl", label: "XX Large (XXL)" },
  { value: "xxxl", label: "XXX Large (XXXL)" },
];

const TestComboBoxComponent = () => {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      category: "",
      size: "",
    },
  });

  const onSubmit = (data: TestFormData) => {
    console.log("Form submitted:", data);
    // Here you would typically send the data to an API
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">ComboBox Test Component</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (100 options)</FormLabel>
                <FormControl>
                  <ComboBox
                    options={mockCategories}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search and select a category..."
                    searchPlaceholder="Search categories..."
                    emptyText="No category found."
                    clearable
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <ComboBox
                    options={mockSizes}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a size..."
                    searchPlaceholder="Search sizes..."
                    emptyText="No size found."
                    clearable
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Button type="submit" className="w-full">
              Submit Test
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                form.setValue("category", "category-5");
                form.setValue("size", "l");
              }}
            >
              Set Test Values
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => form.reset()}
            >
              Reset Form
            </Button>
          </div>
        </form>
      </Form>

      {/* Display current form values for debugging */}
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Current Form Values:</h3>
        <pre className="text-sm">
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestComboBoxComponent;
