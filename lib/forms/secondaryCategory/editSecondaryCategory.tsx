"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { secondaryCategorySchema } from "@/lib/validations";
import { getAllAttributes, IAttribute } from "@/lib/actions/attribute.actions";
import { toast } from "@/hooks/use-toast";
import { IPrimaryCategory, ISecondaryCategory } from "@/types";
import {
  getAllParentCategory,
  IParentCategory,
} from "@/lib/actions/parentCategory.actions";
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

  const form = useForm<ISecondaryCategory>({
    resolver: zodResolver(secondaryCategorySchema),
    defaultValues: {
      name: "",
      vendorId: "",
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
        const parentCategoryResponse = await getAllParentCategory();
        const primaryCategoryResponse = await getAllPrimaryCategories();
        const attributeResponse = await getAllAttributes();
        const categoryResponse = await getSecondaryCategoryById(id as string);

        if (parentCategoryResponse.success) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (primaryCategoryResponse.length > 0) {
          setPrimaryCategories(primaryCategoryResponse as IPrimaryCategory[]);
        }

        if (attributeResponse.success) {
          setAttributes(attributeResponse.data as IAttribute[]);
        }

        if (categoryResponse) {
          form.reset({
            ...categoryResponse,
            vendorId: form.getValues("vendorId"),
            parentCategory: categoryResponse.parentCategory?._id || "",
            primaryCategory: categoryResponse.primaryCategory?._id || "",
            attributes: categoryResponse.attributes.map(
              (attr: IAttribute) => attr._id
            ),
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
  const onSubmit = async (data: ISecondaryCategory) => {
    try {
      await updateSecondaryCategoryById(id as string, {
        ...data,
        attributes:
          data.attributes.length > 0
            ? [data.attributes[0], ...data.attributes.slice(1)]
            : ["default"],
      });

      toast({
        title: "Success",
        description: "Secondary category updated successfully",
      });

      router.push("/vendor/category/secondaryCategory");
    } catch {
      toast({
        title: "Error",
        description: "Failed to update secondary category",
        variant: "destructive",
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
                          <SelectItem key={category.id} value={category.id!}>
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
                    defaultValue={field.value} // Ensure this is an array of strings
                    onValueChange={(values) => field.onChange(values)}
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
            onClick={() => router.push("/vendor/category/secondaryCategory")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditSecondaryCategoryForm;
