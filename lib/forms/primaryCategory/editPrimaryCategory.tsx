"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { primaryCategorySchema } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";
import { IPrimaryCategory } from "@/types";
import {
  getAllParentCategory,
  IParentCategory,
} from "@/lib/actions/parentCategory.actions";
import {
  updatePrimaryCategoryById,
  getPrimaryCategoryById,
} from "@/lib/actions/primaryCategory.actions";
import { useRouter, useParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";

const EditPrimaryCategoryForm = () => {
  // * useStates and hooks
  const { id } = useParams(); // Get the ID from the URL parameters
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const router = useRouter();

  const form = useForm<IPrimaryCategory>({
    resolver: zodResolver(primaryCategorySchema),
    defaultValues: {
      name: "",
      parentCategory: "",
      description: "",
      metaTitle: "",
      metaKeywords: [],
      metaDescription: "",
      isActive: true,
    },
  });
  // * fetch parent and primary category to populate fields
  useEffect(() => {
    const fetchData = async () => {
      try {
        const parentCategoryResponse = await getAllParentCategory();

        const categoryResponse = await getPrimaryCategoryById(id as string);

        if (parentCategoryResponse.success) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (categoryResponse) {
          form.reset({
            ...categoryResponse,
            parentCategory: categoryResponse.parentCategory?._id || "",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [id, form]);
  // * form submission
  const onSubmit = async (data: IPrimaryCategory) => {
    try {
      await updatePrimaryCategoryById(id as string, {
        ...data,
      });

      toast({
        title: "Success",
        description: "Primary category updated successfully",
      });

      router.push("/admin/category/primaryCategory");
    } catch {
      toast({
        title: "Error",
        description: "Failed to update primary category",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
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
            name="parentCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || ""} // Ensures the value is controlled
                    onValueChange={(value) => field.onChange(value)} // Updates form state
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.length > 0 ? (
                        parentCategories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No Parent Categories Available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="description"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <ReactQuill
                    {...field}
                    theme="snow"
                    value={value || ""}
                    onChange={onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter meta title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metaKeywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Keywords</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter meta keywords"
                    {...field}
                    value={field.value?.join(", ") || ""}
                    onChange={(e) => {
                      const keywords = e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k);
                      field.onChange(keywords);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="metaDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Is Active</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="primary-btn">
            Update Primary Category
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/admin/category/primaryCategory")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditPrimaryCategoryForm;
