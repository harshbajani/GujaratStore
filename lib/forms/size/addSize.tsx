"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createSize } from "@/lib/actions/size.actions";
import { useEffect } from "react";

// Define form schema using zod
const sizeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  vendorId: z.string().min(24, "Invalid VendorId"),
  isActive: z.boolean().default(true),
});

// Infer form data type from schema
type SizeFormData = z.infer<typeof sizeSchema>;

const AddSizeForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeSchema),
    defaultValues: {
      label: "",
      value: "",
      vendorId: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: SizeFormData): Promise<void> => {
    try {
      const response = await createSize(
        data.label,
        data.value,
        data.vendorId,
        data.isActive
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Size created successfully",
        });
        router.push("/vendor/size");
      } else {
        throw new Error(response.error || "Size creation failed");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while creating the size",
      });
    }
  };

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const userResponse = await fetch("/api/vendor/current");
        const userData = await userResponse.json();

        if (userData.success && userData.data && userData.data._id) {
          // Set the vendorId in the form
          form.setValue("vendorId", userData.data._id);
          console.log("Vendor ID set:", userData.data._id);
        } else {
          console.error("Failed to get vendor ID from response", userData);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      }
    };

    fetchVendor();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter size label (e.g., Small)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input placeholder="Enter size value (e.g., S)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  {field.value ? "Active" : "Inactive"}
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="primary-btn">
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default AddSizeForm;
