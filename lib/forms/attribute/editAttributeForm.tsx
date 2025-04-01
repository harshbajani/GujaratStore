"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";

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
import {
  getAttributeById,
  updateAttribute,
} from "@/lib/actions/attribute.actions";
import { AttributeFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";

const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vendorId: z.string().min(24, "Invalid VendorId"),
  isActive: z.boolean().default(true),
});

const EditAttributeForm = () => {
  // * Form hooks
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();

  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: "",
      vendorId: "",
      isActive: true,
    },
  });

  // * Function for fetching attribute data
  useEffect(() => {
    const fetchAttribute = async () => {
      try {
        const response = await getAttributeById(id as string);
        const userResponse = await fetch("/api/vendor/current");
        const userData = await userResponse.json();

        if (response.success && response.data) {
          const attributeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          // Set the form data with the vendor ID from current vendor
          form.reset({
            name: attributeData.name,
            vendorId: userData.data._id, // Use vendor ID from current vendor
            isActive: attributeData.isActive,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch attribute data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttribute();
  }, [id, form, toast]);
  // * Form submission handler
  const onSubmit = async (data: AttributeFormData) => {
    try {
      const userResponse = await fetch("/api/vendor/current");
      const userData = await userResponse.json();

      if (userData.success && userData.data && userData.data._id) {
        // Always use the current vendor's ID
        data.vendorId = userData.data._id;
        console.log("Using vendor ID:", data.vendorId);
      }

      const response = await updateAttribute(id as string, data);

      if (response.success) {
        toast({
          title: "Success",
          description: "Attribute updated successfully",
        });
        router.push("/vendor/attribute");
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update attribute",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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

export default EditAttributeForm;
