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
import { getAllPrimaryCategories } from "@/lib/actions/admin/primaryCategory.actions";
import { getAllSecondaryCategories } from "@/lib/actions/admin/secondaryCategory.actions";
import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IAdminBrand,
  IPrimaryCategory,
  IProduct,
  IProductSecondaryCategory,
  ISizes,
} from "@/types";
import {
  getAllAttributes,
  IAttribute,
} from "@/lib/actions/admin/attribute.actions";
import { useParams, useRouter } from "next/navigation";
import { productSchema } from "@/lib/validations";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import PriceCalculator from "@/components/PriceCalculator";
import { Switch } from "@/components/ui/switch";
import { getAllBrands } from "@/lib/actions/admin/brand.actions";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAllSizes } from "@/lib/actions/size.actions";
import { MultiSelect } from "@/components/ui/multi-select";

const EditProductsForm = () => {
  // * useStates and hooks
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
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
  const [brands, setBrands] = useState<IAdminBrand[]>([]);
  const [sizes, setSizes] = useState<ISizes[]>([]);

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
      productSize: [],
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
      deliveryCharges: 0,
      deliveryDays: 0,
      productQuantity: 0,
      productStatus: true,
      productRating: 0,
      productWarranty: "",
      productReturnPolicy: "",
    },
  });

  // * price handling
  const basePrice = form.watch("basePrice");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const gstRate = form.watch("gstRate");

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
        const currentAttributes = form.getValues("attributes");
        // Only set initial attributes if none exist
        if (currentAttributes.length === 0) {
          const initialAttributes = selectedCategory.attributes.map((attr) => ({
            attributeId: attr._id,
            value: "",
          }));
          form.setValue("attributes", initialAttributes);
        }
      }
    }
  }, [selectedSecondaryCategoryId, secondaryCategory, form]);

  // * function to handle the product images and cover images
  const productCoverImage = form.watch("productCoverImage");
  const productImages = form.watch("productImages");

  const coverPreview = useMemo(() => {
    if (productCoverImage instanceof File) {
      return URL.createObjectURL(productCoverImage);
    } else if (typeof productCoverImage === "string" && productCoverImage) {
      return `/api/files/${productCoverImage}`;
    }
    return "";
  }, [productCoverImage]);

  const productPreviews = useMemo(() => {
    return productImages.map((image) => {
      if (image instanceof File) {
        return URL.createObjectURL(image);
      } else if (typeof image === "string" && image) {
        return `/api/files/${image}`;
      }
      return "";
    });
  }, [productImages]);

  // * Cover image handler
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("productCoverImage", file);
    }
  };

  // * Product images handler
  const handleProductImagesSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentProductImages = form.getValues("productImages");
      const newProductImages = [...currentProductImages, ...files];
      form.setValue("productImages", newProductImages);
    }
  };

  // * Remove product image preview
  const removeProductPreview = (index: number) => {
    const currentProductImages = form.getValues("productImages");
    const newProductImages = currentProductImages.filter((_, i) => i !== index);
    form.setValue("productImages", newProductImages);
  };

  // * Remove cover image preview
  const removeCoverPreview = () => {
    form.setValue("productCoverImage", "");
  };
  // * fetch the product to populate the fields
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Make sure we're using the correct URL structure
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();

        if (data.success) {
          const product = data.data;
          const productSizeIds = product.productSize
            ? product.productSize.map((size: ISizes) => size._id)
            : [];
          // Set form values with null checks
          form.reset({
            ...product,
            parentCategory: product.parentCategory?._id || "",
            primaryCategory: product.primaryCategory?._id || "",
            secondaryCategory: product.secondaryCategory?._id || "",
            brands: product.brands?._id || "",
            productSize: productSizeIds,
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // * data submission
  const onSubmit = async (data: IProduct) => {
    console.log("Form submission triggered with data:", data);
    try {
      setIsLoading(true);

      // Handle cover image
      let coverImageId = data.productCoverImage;
      if (data.productCoverImage instanceof File) {
        const coverFormData = new FormData();
        coverFormData.append("file", data.productCoverImage);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: coverFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Cover image upload failed: ${await uploadResponse.text()}`
          );
        }

        const { fileId } = await uploadResponse.json();
        coverImageId = fileId;
      }

      // Handle product images
      const productImageIds = await Promise.all(
        data.productImages.map(async (image) => {
          if (image instanceof File) {
            const formData = new FormData();
            formData.append("file", image);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(
                `Product image upload failed: ${await uploadResponse.text()}`
              );
            }

            const { fileId } = await uploadResponse.json();
            return fileId;
          }
          return image;
        })
      );

      // Prepare final data
      const finalData = {
        ...data,
        _id: params.id,
        productCoverImage: coverImageId,
        productImages: productImageIds,
      };

      console.log(
        "Sending PUT request to:",
        `/api/admin/products/${params.id}`
      );
      console.log("With data:", finalData);

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      const responseData = await response.json();
      console.log("API response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Update failed");
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error during update:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // * fetch the data for the select fields
  useEffect(() => {
    const fetchData = async () => {
      try {
        const parentCategoryResponse = await getAllParentCategory();
        const primaryCategoryResponse = await getAllPrimaryCategories();
        const secondaryCategoryResponse = await getAllSecondaryCategories();
        const attributeResponse = await getAllAttributes();
        const brandResponse = await getAllBrands();
        const sizesResponse = await getAllSizes();

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
          setBrands(brandResponse as IAdminBrand[]);
        }
        if (sizesResponse.success) {
          setSizes(sizesResponse.data as ISizes[]);
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
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      productPreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [coverPreview, productPreviews]);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!params.id) {
            toast({
              title: "Error",
              description: "Product ID is missing",
              variant: "destructive",
            });
            return;
          }
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-8"
      >
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
                    {...field}
                    placeholder="Enter product quantity"
                    defaultValue={field.value}
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
                    {...field}
                    options={sizes.map((size) => ({
                      value: size._id || "",
                      label: size.label,
                      isActive: size.isActive,
                    }))}
                    onValueChange={(values) => {
                      field.onChange(values);
                      console.log("Selected values:", values);
                    }}
                    defaultValue={field.value}
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

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="productReturnPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Return Policy</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Return policy"
                    value={field.value || ""}
                  />
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
                  <Textarea
                    {...field}
                    placeholder="Product Warranty"
                    value={field.value || ""}
                  />
                </FormControl>
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
          <Button
            type="submit"
            className="primary-btn"
            disabled={isLoading}
            onClick={() => {
              console.log("Manual submission attempt");
              const data = form.getValues();
              onSubmit(data);
            }}
          >
            {isLoading ? "Updating..." : "Update Product"}
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

export default EditProductsForm;
