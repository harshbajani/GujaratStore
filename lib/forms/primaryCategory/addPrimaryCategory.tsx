import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { primaryCategorySchema } from "@/lib/validations";
import { getAllAttributes, IAttribute } from "@/lib/actions/attribute.actions";
import { toast } from "@/hooks/use-toast";
import { IPrimaryCategory } from "@/types";
import {
  getAllParentCategory,
  IParentCategory,
} from "@/lib/actions/parentCategory.actions";
import { createPrimaryCategory } from "@/lib/actions/primaryCategory.actions";
import { useRouter } from "next/navigation";

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

const AddPrimaryCategoryForm = () => {
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const router = useRouter();

  const form = useForm<IPrimaryCategory>({
    resolver: zodResolver(primaryCategorySchema),
    defaultValues: {
      name: "",
      parentCategory: "",
      attributes: [],
      description: "",
      metaTitle: "",
      metaKeywords: [],
      metaDescription: "",
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const parentCategoryResponse = await getAllParentCategory();
        const attributeResponse = await getAllAttributes();

        if (parentCategoryResponse.success) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (attributeResponse.success) {
          setAttributes(attributeResponse.data as IAttribute[]);
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
  }, []);

  const onSubmit = async (data: IPrimaryCategory) => {
    try {
      await createPrimaryCategory({
        ...data,
        attributes:
          data.attributes.length > 0
            ? [data.attributes[0], ...data.attributes.slice(1)]
            : ["default"],
      });

      toast({
        title: "Success",
        description: "Primary category added successfully",
      });

      router.push("/vendor/category/primaryCategory");
    } catch {
      toast({
        title: "Error",
        description: "Failed to add primary category",
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                    onValueChange={(values) => {
                      field.onChange(values); // Update the form state
                    }}
                    defaultValue={field.value} // Ensure this is set correctly
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
            Add Primary Category
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/vendor/category/primaryCategory")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddPrimaryCategoryForm;
