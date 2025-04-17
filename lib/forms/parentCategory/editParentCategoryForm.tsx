"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { parentCategorySchema } from "@/lib/validations";
import {
  getParentCategoryById,
  updateParentCategory,
} from "@/lib/actions/parentCategory.actions";
import { ParentCategoryFormData } from "@/types";
import Loader from "@/components/Loader";

interface EditParentCategoryFormProps {
  parentCategoryId: string;
}

const EditParentCategoryForm = ({
  parentCategoryId,
}: EditParentCategoryFormProps) => {
  // * useStates and hooks
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ParentCategoryFormData>({
    resolver: zodResolver(parentCategorySchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });
  // * fetching parent category
  useEffect(() => {
    const fetchParentCategory = async () => {
      try {
        const response = await getParentCategoryById(parentCategoryId);
        if (response.success && response.data) {
          form.reset({
            name: Array.isArray(response.data) ? "" : response.data.name,
            isActive: Array.isArray(response.data)
              ? true
              : response.data.isActive,
          });
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to fetch parent category",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch parent category",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParentCategory();
  }, [parentCategoryId, form, toast]);
  // * form submission
  const onSubmit = async (data: ParentCategoryFormData) => {
    try {
      const response = await updateParentCategory(parentCategoryId, data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Parent category updated successfully",
        });
        router.push("/admin/category/parentCategory");
      } else {
        throw new Error(response.error);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update parent category",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div>
        <Loader />
      </div>
    );
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
                <Input placeholder="Enter parent category name" {...field} />
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

export default EditParentCategoryForm;
