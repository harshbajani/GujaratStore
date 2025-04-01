"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AttributeFormData } from "@/types";
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
import { createAttribute } from "@/lib/actions/attribute.actions";
import { useEffect } from "react";

const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vendorId: z.string().min(24, "Invalid VendorId"),
  isActive: z.boolean().default(true),
});

const AddAttributeForm = () => {
  // * Form Hook
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: "",
      vendorId: "",
      isActive: true,
    },
  });

  // * Form Submit
  const onSubmit = async (data: AttributeFormData): Promise<void> => {
    try {
      await createAttribute(data.name, data.vendorId, data.isActive);
      toast({
        title: "Success",
        description: "Attribute added successfully",
      });
      router.push("/vendor/attribute");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter attribute name" {...field} />
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
export default AddAttributeForm;
