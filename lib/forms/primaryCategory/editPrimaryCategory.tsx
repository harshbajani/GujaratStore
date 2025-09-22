"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { primaryCategorySchema } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";
import { getAllParentCategory } from "@/lib/actions/parentCategory.actions";
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
import slugify from "slugify";
import Loader from "@/components/Loader";

interface FormData extends Omit<IPrimaryCategory, "parentCategory"> {
  parentCategory: string;
}

const EditPrimaryCategoryForm = () => {
  const { id } = useParams();
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const generateSlug = (name: string) => {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(primaryCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parentCategory: "",
      description: "",
      metaTitle: "",
      metaKeywords: [],
      metaDescription: "",
      isActive: true,
    },
  });
  const primaryCategoryName = form.watch("name");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [parentCategoryResponse, categoryResponse] = await Promise.all([
          getAllParentCategory(),
          getPrimaryCategoryById(id as string),
        ]);

        if (parentCategoryResponse.success && parentCategoryResponse.data) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (categoryResponse.success && categoryResponse.data) {
          const category = categoryResponse.data as IPrimaryCategory;
          form.reset({
            name: category.name,
            slug: category.slug || generateSlug(category.name),
            parentCategory:
              typeof category.parentCategory === "string"
                ? category.parentCategory
                : category.parentCategory._id,
            description: category.description || "",
            metaTitle: category.metaTitle || "",
            metaKeywords: category.metaKeywords || [],
            metaDescription: category.metaDescription || "",
            isActive: category.isActive,
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch category data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updatePrimaryCategoryById(id as string, {
        ...data,
        parentCategory: data.parentCategory,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }

      toast({
        title: "Success",
        description: "Primary category updated successfully",
      });

      router.push("/admin/category/primaryCategory");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update primary category",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (primaryCategoryName) {
      const slug = generateSlug(primaryCategoryName);
      form.setValue("slug", slug);
    }
  }, [primaryCategoryName, form]);

  if (isLoading) {
    return <Loader />;
  }

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
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="product-slug"
                    {...field}
                    readOnly
                    className="bg-gray-50"
                  />
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    value={field.value?.join(", ") || ""}
                    onChange={(e) => {
                      const keywords = e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean);
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
                <Input placeholder="Enter meta description" {...field} />
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
