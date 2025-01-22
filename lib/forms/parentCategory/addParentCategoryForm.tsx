"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ParentCategoryFormData } from "@/types";
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
import { parentCategorySchema } from "@/lib/validations";
import { createParentCategory } from "@/lib/actions/parentCategory.actions";

const AddParentCategoryForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<ParentCategoryFormData>({
    resolver: zodResolver(parentCategorySchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: ParentCategoryFormData): Promise<void> => {
    try {
      await createParentCategory(data.name, data.isActive);
      toast({
        title: "Success",
        description: "Parent Category added successfully",
      });
      router.push("/vendor/category/parentCategory");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
      });
    }
  };

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
                <Input placeholder="Enter category name" {...field} />
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
export default AddParentCategoryForm;
