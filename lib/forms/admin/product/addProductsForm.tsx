"use client";
import { Input } from "@/components/ui/input";
import { ComboBox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { getAllDropdownData } from "@/lib/actions/dropdown.actions";
import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { adminProductSchema } from "@/lib/validations";
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
import { getAllSizes } from "@/lib/actions/size.actions";
import { MultiSelect } from "@/components/ui/multi-select";
import slugify from "slugify";
import Loader from "@/components/Loader";

const AddProductsForm = () => {
  const generateSlug = (name: string) => {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  };
  // * useStates and hooks
  const [parentCategories, setParentCategories] = useState<IParentCategory[]>(
    []
  );
  const [primaryCategory, setPrimaryCategory] = useState<IPrimaryCategory[]>(
    []
  );
  const [secondaryCategory, setSecondaryCategory] = useState<
    SecondaryCategoryWithPopulatedFields[]
  >([]);
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<IAdminBrand[]>([]);
  const [sizes, setSizes] = useState<ISizes[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [coverPreview, setCoverPreview] = useState("");
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const router = useRouter();
  const form = useForm<IProduct>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      productName: "",
      slug: "",
      parentCategory: "",
      primaryCategory: "",
      secondaryCategory: "", // Note: matches the interface property name
      attributes: [],
      brands: "",
      gender: "male",
      productColor: "",
      productSize: [],
      productSKU: "",
      productDescription: "",
      productImages: [],
      productCoverImage: "",
      mrp: 0,
      landingPrice: 0,
      discountType: "percentage",
      discountValue: 0,
      gstType: "exclusive",
      gstRate: 0,
      gstAmount: 0,
      netPrice: 0,
      deliveryCharges: 0,
      deliveryDays: 0,
      productQuantity: 0,
      productStatus: true,
      productRating: 0,
      productWarranty: "",
      productReturnPolicy: "",
    },
  });

  const productName = form.watch("productName");
  const mrp = form.watch("mrp");
  const gstType = form.watch("gstType");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const gstRate = form.watch("gstRate");
  // * function for handling prices
  useEffect(() => {
    const discountedBase =
      discountType === "percentage"
        ? mrp - mrp * (discountValue / 100)
        : mrp - discountValue;

    const safeDiscountedBase = Math.max(discountedBase || 0, 0);
    if (gstType === "inclusive") {
      const gstAmountInclusive =
        (safeDiscountedBase * (gstRate || 0)) / (100 + (gstRate || 0));
      form.setValue("gstAmount", gstAmountInclusive);
      form.setValue("netPrice", safeDiscountedBase);
    } else {
      const calculatedGstAmount = ((mrp || 0) * (gstRate || 0)) / 100;
      form.setValue("gstAmount", calculatedGstAmount);
      form.setValue("netPrice", safeDiscountedBase + calculatedGstAmount);
    }
  }, [mrp, discountType, discountValue, gstRate, gstType, form]);

  // * function to look out for attributes based on secondary category
  const { fields } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const selectedSecondaryCategoryId = form.watch("secondaryCategory");

  const selectedSecondaryCategory = useMemo(() => {
    if (!selectedSecondaryCategoryId) return undefined;
    return secondaryCategory.find((cat) => {
      const catId = (cat._id || cat.id || "").toString();
      return catId === selectedSecondaryCategoryId.toString();
    });
  }, [selectedSecondaryCategoryId, secondaryCategory]);

  const attributeNameById = useMemo(() => {
    const map = new Map<string, string>();
    if (selectedSecondaryCategory?.attributes) {
      selectedSecondaryCategory.attributes.forEach((attr) => {
        if (attr._id) map.set(attr._id.toString(), attr.name);
      });
    }
    // Also include global attributes as fallback
    attributes.forEach((attr) => {
      const key = attr._id?.toString();
      if (key && !map.has(key)) map.set(key, attr.name);
    });
    return map;
  }, [selectedSecondaryCategory, attributes]);

  useEffect(() => {
    if (selectedSecondaryCategoryId) {
      const selectedCategory = secondaryCategory.find(
        (cat) =>
          cat._id === selectedSecondaryCategoryId ||
          cat.id === selectedSecondaryCategoryId
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
      const response = await fetch("/api/admin/products", {
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

      toast({
        title: "Success",
        description: "Product added successfully",
      });
      router.push("/admin/products");
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
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [dropdownResponse, brandResponse, sizesResponse] =
          await Promise.all([
            getAllDropdownData(),
            getAllBrands(),
            getAllSizes(),
          ]);

        if (!isSubscribed) return;

        if (dropdownResponse.success && dropdownResponse.data) {
          const {
            parentCategories,
            primaryCategories,
            secondaryCategories,
            attributes,
          } = dropdownResponse.data;
          setParentCategories(parentCategories);
          setPrimaryCategory(primaryCategories);
          setSecondaryCategory(secondaryCategories);
          setAttributes(attributes);
        }

        if (brandResponse.success && brandResponse.data) {
          setBrands(brandResponse.data);
        }
        if (sizesResponse.success) {
          setSizes(sizesResponse.data as ISizes[]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // * Add cleanup for object URLs
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(coverPreview);
      productPreviews.forEach(URL.revokeObjectURL);
    };
  }, [coverPreview, productPreviews]);

  useEffect(() => {
    if (productName) {
      const slug = generateSlug(productName);
      form.setValue("slug", slug);
    }
  }, [productName, form]);

  if (loading) {
    return <Loader />;
  }

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
            name="productSKU"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product SKU</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter product SKU"
                    {...field}
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="brands"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <ComboBox
                    options={brands.map((brand) => ({
                      value: brand._id!,
                      label: brand.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search and select brand..."
                    searchPlaceholder="Search brands..."
                    emptyText="No brands found."
                    clearable
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
                  <ComboBox
                    options={parentCategories.map((category) => ({
                      value: category._id,
                      label: category.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search and select parent category..."
                    searchPlaceholder="Search parent categories..."
                    emptyText="No parent categories found."
                    clearable
                  />
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
                  <ComboBox
                    options={primaryCategory.map((category) => ({
                      value: category._id!,
                      label: category.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search and select primary category..."
                    searchPlaceholder="Search primary categories..."
                    emptyText="No primary categories found."
                    clearable
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-6 items-center">
          <FormField
            control={form.control}
            name="secondaryCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Category</FormLabel>
                <FormControl>
                  <ComboBox
                    options={secondaryCategory.map((category) => ({
                      value: category._id || category.id!,
                      label: category.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search and select secondary category..."
                    searchPlaceholder="Search secondary categories..."
                    emptyText="No secondary categories found."
                    clearable
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="productSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Size</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={sizes.map((size) => ({
                      value: size._id || "",
                      label: size.label,
                    }))}
                    onValueChange={(values) => {
                      field.onChange(values); // Update the form state
                    }}
                    defaultValue={Array.isArray(field.value) ? field.value : []} // Ensure this is set correctly
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
                  <RadioGroup
                    {...field}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>

                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>

                      <RadioGroupItem value="unisex" id="unisex" />
                      <Label htmlFor="unisex">Unisex</Label>

                      <RadioGroupItem
                        value="not-applicable"
                        id="not-applicable"
                      />
                      <Label htmlFor="not-applicable">Not Applicable</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {fields.length > 0 && (
          <div className="col-span-5">
            <h3 className="text-sm font-semibold">Attributes</h3>
          </div>
        )}
        <div className="grid grid-cols-5 gap-6">
          {fields.map((field, index) => {
            const attribute = attributes.find(
              (attr) =>
                (attr._id || "").toString() ===
                (field.attributeId || "").toString()
            );
            const label =
              attributeNameById.get((field.attributeId || "").toString()) ||
              attribute?.name;
            return (
              <FormField
                control={form.control}
                key={field.id}
                name={`attributes.${index}.value`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${label || "value"}`}
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
            name="productReturnPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Return Policy</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Return policy" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productWarranty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Warranty</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Product Warranty" />
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
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddProductsForm;
