"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { secondaryCategorySchema } from "@/lib/validations";
import { getAllAttributesLegacy } from "@/lib/actions/attribute.actions";
import { toast } from "@/hooks/use-toast";
import { getAllParentCategory } from "@/lib/actions/parentCategory.actions";
import {
  updateSecondaryCategoryById,
  getSecondaryCategoryById,
} from "@/lib/actions/secondaryCategory.actions";
import { getAllPrimaryCategories } from "@/lib/actions/primaryCategory.actions";
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
import { MultiSelect } from "@/components/ui/multi-select";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";

// First, create an interface for the form data
interface FormData {
  name: string;
  parentCategory: string;
  primaryCategory: string;
  attributes: string[];
  description: string;
  isActive: boolean;
}

const EditSecondaryCategoryForm = () => {
  // * useStates and hooks
  const { id } = useParams(); // Get the ID from the URL parameters
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [primaryCategories, setPrimaryCategories] = useState<
    IPrimaryCategory[]
  >([]);
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(secondaryCategorySchema),
    defaultValues: {
      name: "",
      parentCategory: "",
      primaryCategory: "",
      attributes: [],
      description: "",
      isActive: true,
    },
  });
  // * fetching data to populate fields
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          parentCategoryResponse,
          primaryCategoryResponse,
          attributeResponse,
          categoryResponse,
        ] = await Promise.all([
          getAllParentCategory(),
          getAllPrimaryCategories(),
          getAllAttributesLegacy(),
          getSecondaryCategoryById(id as string),
        ]);

        // Handle parent categories
        if (parentCategoryResponse.success && parentCategoryResponse.data) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        // Handle primary categories
        if (primaryCategoryResponse.success && primaryCategoryResponse.data) {
          setPrimaryCategories(
            primaryCategoryResponse.data as IPrimaryCategory[]
          );
        }

        // Handle attributes
        if (attributeResponse.success && attributeResponse.data) {
          setAttributes(attributeResponse.data as IAttribute[]);
        }

        // Handle category data
        if (categoryResponse.success && categoryResponse.data) {
          const category =
            categoryResponse.data as SecondaryCategoryWithPopulatedFields;

          // Convert populated fields to IDs
          const parentCategoryId =
            typeof category.parentCategory === "string"
              ? category.parentCategory
              : category.parentCategory._id;

          const primaryCategoryId =
            typeof category.primaryCategory === "string"
              ? category.primaryCategory
              : category.primaryCategory._id;

          const attributeIds = category.attributes.map((attr) =>
            typeof attr === "string" ? attr : attr._id
          );

          form.reset({
            name: category.name,
            parentCategory: parentCategoryId,
            primaryCategory: primaryCategoryId,
            attributes: attributeIds,
            description: category.description,
            isActive: category.isActive,
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, form]);
  // * form submission
  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateSecondaryCategoryById(id as string, {
        ...data,
        attributes: data.attributes,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }

      toast({
        title: "Success",
        description: "Secondary category updated successfully",
      });

      router.push("/admin/category/secondaryCategory");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update secondary category",
        variant: "destructive",
      });
    }
  };

  // Update the MultiSelect component usage
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
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
          <FormField
            control={form.control}
            name="primaryCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Category</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || ""} // Ensures the value is controlled
                    onValueChange={(value) => field.onChange(value)} // Updates form state
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryCategories.length > 0 ? (
                        primaryCategories.map((category) => (
                          <SelectItem key={category._id} value={category._id!}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No Primary Categories Available
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

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="attributes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attributes</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={attributes.map((attr) => ({
                      value: attr._id,
                      label: attr.name,
                    }))}
                    defaultValue={field.value}
                    onValueChange={(values: string[]) => field.onChange(values)}
                    placeholder="Select attributes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            Update Secondary Category
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/admin/category/secondaryCategory")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditSecondaryCategoryForm;
