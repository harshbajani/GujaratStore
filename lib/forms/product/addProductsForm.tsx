"use client";
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

import {
  getAllParentCategory,
  IParentCategory,
} from "@/lib/actions/parentCategory.actions";
import { getAllPrimaryCategories } from "@/lib/actions/primaryCategory.actions";
import { getAllSecondaryCategories } from "@/lib/actions/secondaryCategory.actions";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IBrand,
  IPrimaryCategory,
  IProduct,
  IProductSecondaryCategory,
} from "@/types";
import { getAllAttributes, IAttribute } from "@/lib/actions/attribute.actions";
import { useRouter } from "next/navigation";
import { productSchema } from "@/lib/validations";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import PriceCalculator from "@/components/PriceCalculator";
import { Switch } from "@/components/ui/switch";
import { getAllBrands } from "@/lib/actions/brand.actions";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const AddProductsForm = () => {
  // * useStates and hooks
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [primaryCategory, setPrimaryCategory] = useState<IPrimaryCategory[]>(
    []
  );
  const [secondaryCategory, setSecondaryCategory] = useState<
    IProductSecondaryCategory[]
  >([]);
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [coverPreview, setCoverPreview] = useState("");
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const router = useRouter();
  const form = useForm<IProduct>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      parentCategory: "",
      primaryCategory: "",
      secondaryCategory: "", // Note: matches the interface property name
      attributes: [],
      brands: "",
      gender: "male",
      productColor: "",
      productSKU: "",
      productDescription: "",
      productImages: [],
      productCoverImage: "",
      mrp: 0,
      basePrice: 0,
      discountType: "percentage",
      discountValue: 0,
      gstRate: 0,
      gstAmount: 0,
      netPrice: 0,
      productQuantity: 0,
      productStatus: true,
      productRating: 0,
      productWarranty: "",
      productReturnPolicy: "",
    },
  });

  const basePrice = form.watch("basePrice");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const gstRate = form.watch("gstRate");
  // * function for handling prices
  useEffect(() => {
    const basePriceAfterDiscount =
      discountType === "percentage"
        ? basePrice - basePrice * (discountValue / 100)
        : basePrice - discountValue;

    const calculatedGstAmount = (basePriceAfterDiscount * gstRate) / 100;

    form.setValue("gstAmount", calculatedGstAmount);
    form.setValue("netPrice", basePriceAfterDiscount + calculatedGstAmount);
  }, [basePrice, discountType, discountValue, gstRate, form]);

  // * function to look out for attributes based on secondary category
  const { fields } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const selectedSecondaryCategoryId = form.watch("secondaryCategory");

  useEffect(() => {
    if (selectedSecondaryCategoryId) {
      const selectedCategory = secondaryCategory.find(
        (cat) => cat.id === selectedSecondaryCategoryId
      );
      if (selectedCategory) {
        const initialAttributes = selectedCategory.attributes.map((attr) => ({
          attributeId: attr._id, // Access _id from the attribute object
          value: "",
        }));
        form.setValue("attributes", initialAttributes);
      }
    }
  }, [selectedSecondaryCategoryId, secondaryCategory, form]);

  // * Handle cover image selection
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      form.setValue("productCoverImage", file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // * Product images handler
  const handleProductImagesSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...productImageFiles, ...files];
      setProductImageFiles(newFiles);
      form.setValue("productImages", newFiles);
      setProductPreviews((prev) => [
        ...prev,
        ...files.map((file) => URL.createObjectURL(file)),
      ]);
    }
  };

  // * Remove product image preview
  const removeProductPreview = (index: number) => {
    const newFiles = productImageFiles.filter((_, i) => i !== index);
    setProductImageFiles(newFiles);
    form.setValue("productImages", newFiles);
    setProductPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // * Remove cover image preview
  const removeCoverPreview = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview("");
      setCoverImageFile(null);
    }
  };

  // * form submision
  const onSubmit = async (data: IProduct) => {
    try {
      // Validate required fields are present
      if (!data.productCoverImage) {
        console.error("Cover image is missing");
        return;
      }

      if (!data.productImages || data.productImages.length === 0) {
        console.error("Product images are missing");
        return;
      }

      // Upload cover image
      let coverImageId;
      try {
        coverImageId =
          data.productCoverImage instanceof File
            ? await uploadFile(data.productCoverImage)
            : data.productCoverImage;
        console.log("Cover image uploaded:", coverImageId);
      } catch (error) {
        console.error("Error uploading cover image:", error);
        return;
      }

      // Upload product images
      let productImageIds;
      try {
        productImageIds = await Promise.all(
          data.productImages.map(async (item) => {
            if (item instanceof File) {
              return await uploadFile(item);
            }
            return item;
          })
        );
        console.log("Product images uploaded:", productImageIds);
      } catch (error) {
        console.error("Error uploading product images:", error);
        return;
      }

      // Create final payload
      const finalData = {
        ...data,
        productCoverImage: coverImageId,
        productImages: productImageIds,
      };

      // Submit to API
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      toast({
        title: "Sucsess",
        description: "Product added successfully",
      });
      router.push("/vendor/products");
      console.log("Submission successful:", result);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "Error adding product",
        variant: "destructive",
      });
    }
  };

  // * upload helper function with better error handling
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `File upload failed: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    return result.fileId;
  };
  // * fetching the data for the select components
  useEffect(() => {
    const fetchData = async () => {
      try {
        const parentCategoryResponse = await getAllParentCategory();
        const primaryCategoryResponse = await getAllPrimaryCategories();
        const secondaryCategoryResponse = await getAllSecondaryCategories();
        const attributeResponse = await getAllAttributes();
        const brandResponse = await getAllBrands();

        if (parentCategoryResponse.success) {
          setParentCategories(parentCategoryResponse.data as IParentCategory[]);
        }

        if (primaryCategoryResponse.length > 0) {
          setPrimaryCategory(primaryCategoryResponse as IPrimaryCategory[]);
        }

        if (secondaryCategoryResponse.length > 0) {
          setSecondaryCategory(
            secondaryCategoryResponse as IProductSecondaryCategory[]
          );
        }

        if (attributeResponse.success) {
          setAttributes(attributeResponse.data as IAttribute[]);
        }
        if (brandResponse.length > 0) {
          setBrands(brandResponse as IBrand[]);
        }
      } catch {
        console.log("error");
      }
    };

    fetchData();
  }, []);

  // * Add cleanup for object URLs
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(coverPreview);
      productPreviews.forEach(URL.revokeObjectURL);
    };
  }, [coverPreview, productPreviews]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="productName"
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
            name="productSKU"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product SKU" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brands"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((category) => (
                        <SelectItem key={category._id} value={category._id!}>
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
        <div className="grid grid-cols-3 gap-6">
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
          <FormField
            control={form.control}
            name="secondaryCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select secondary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryCategory.map((category) => (
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
        <div className="grid grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="productColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Color</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product color" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Quantity</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter product quantity"
                    {...field}
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup defaultValue="male" {...field}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>

                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>

                      <RadioGroupItem value="unisex" id="unisex" />
                      <Label htmlFor="unisex">Unisex</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-5 gap-6">
          {fields.map((field, index) => {
            const attribute = attributes.find(
              (attr) => attr._id === field.attributeId
            );
            return (
              <FormField
                control={form.control}
                key={field.id}
                name={`attributes.${index}.value`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{attribute?.name}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${attribute?.name}`}
                        {...inputField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>

        <PriceCalculator control={form.control} />
        <div className="grid grid-cols-2 gap-6">
          {/* Cover Image Field */}
          <FormField
            control={form.control}
            name="productCoverImage"
            render={() => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageSelect}
                  />
                </FormControl>
                {coverPreview && (
                  <div className="relative mt-2">
                    <Image
                      src={coverPreview}
                      alt="Cover Preview"
                      width={200}
                      height={200}
                    />
                    <Button
                      type="button"
                      onClick={removeCoverPreview}
                      className="absolute top-1 right-0 h-5 px-2 rounded-full bg-brand border-none text-white"
                      variant="outline"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Images Field */}
          <FormField
            control={form.control}
            name="productImages"
            render={() => (
              <FormItem>
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProductImagesSelect}
                  />
                </FormControl>
                <div className="flex flex-wrap gap-2 mt-2">
                  {productPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={preview}
                        alt="Product Preview"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                      <Button
                        type="button"
                        onClick={() => removeProductPreview(index)}
                        className="absolute top-1 right-0 h-5 px-2 rounded-full bg-brand border-none text-white"
                        variant="outline"
                        size="sm"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-full">
          <FormField
            control={form.control}
            name="productDescription"
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
                  <Input {...field} placeholder="Meta Title" />
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
                <FormLabel>Meta Keywords (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Meta Keyword" />
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
                <Textarea {...field} placeholder="Meta Description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productStatus"
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
            Add Product
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/vendor/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddProductsForm;
