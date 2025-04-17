"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
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
import { getSizeById, updateSize } from "@/lib/actions/size.actions";
import { ISize } from "@/lib/models/size.model";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";

// Define the schema for size using zod
const sizeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  isActive: z.boolean().default(true),
});

// Infer the form data type from the schema
type SizeFormData = z.infer<typeof sizeSchema>;

const EditSizeForm = () => {
  const { id } = useParams() as { id: string }; // Ensure id is defined
  const router = useRouter();

  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeSchema),
    defaultValues: {
      label: "",
      value: "",
      isActive: true,
    },
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the size details and populate the form
  useEffect(() => {
    const fetchSize = async () => {
      try {
        const response = await getSizeById(id);
        if (response.success && response.data) {
          const size = response.data as ISize;
          form.reset({
            label: size.label,
            value: size.value,
            isActive: size.isActive,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Size not found",
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching size:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch size",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSize();
    }
  }, [id]);

  const onSubmit = async (data: SizeFormData) => {
    try {
      const response = await updateSize(id, data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Size updated successfully",
        });
        router.push("/admin/size");
      } else {
        throw new Error(response.error || "Update failed");
      }
    } catch (error: unknown) {
      console.error("Update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update size",
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

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
                <FormLabel>Active Status</FormLabel>
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
          Update Size
        </Button>
      </form>
    </Form>
  );
};

export default EditSizeForm;
