import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { secondaryCategorySchema } from "@/lib/validations";
import { getAllAttributes } from "@/lib/actions/attribute.actions";
import { toast } from "@/hooks/use-toast";
import { getAllParentCategory } from "@/lib/actions/parentCategory.actions";
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
import { createSecondaryCategory } from "@/lib/actions/secondaryCategory.actions";
import { getAllPrimaryCategories } from "@/lib/actions/primaryCategory.actions";

const AddSecondaryCategoryForm = () => {
  // * useStates and hooks
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [primaryCategory, setPrimaryCategory] = useState<IPrimaryCategory[]>(
    []
  );
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const router = useRouter();

  const form = useForm<ISecondaryCategory>({
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
  // * fetch the data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const parentCategoryResponse = await getAllParentCategory();
        const primaryCategoryResponse = await getAllPrimaryCategories();
        const attributeResponse = await getAllAttributes();

        if (parentCategoryResponse.success) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (primaryCategoryResponse.length > 0) {
          setPrimaryCategory(primaryCategoryResponse as IPrimaryCategory[]);
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
  // * form submission
  const onSubmit = async (data: ISecondaryCategory) => {
    try {
      await createSecondaryCategory({
        ...data,
        attributes:
          data.attributes.length > 0
            ? [data.attributes[0], ...data.attributes.slice(1)]
            : ["default"],
      });

      toast({
        title: "Success",
        description: "Secondary category added successfully",
      });

      router.push("/admin/category/secondaryCategory");
    } catch {
      toast({
        title: "Error",
        description: "Failed to add secondary category",
        variant: "destructive",
      });
    }
  };

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
          <FormField
            control={form.control}
            name="primaryCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryCategory.map((category) => (
                        <SelectItem key={category.id} value={category.id!}>
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
            Add Secondary Category
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/category/secondaryCategory")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddSecondaryCategoryForm;
