/* eslint-disable @typescript-eslint/no-explicit-any */
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

import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { productSchema } from "@/lib/validations";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import slugify from "slugify";
import SizePricing from "@/components/SizePricing";
import { getAllDropdownData } from "@/lib/actions/dropdown.actions";
import { getAllBrandsLegacy } from "@/lib/actions/brand.actions";
import { getAllSizesLegacy } from "@/lib/actions/size.actions";

const EditProductsForm = () => {
  const generateSlug = (name: string) => {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  };
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
    SecondaryCategoryWithPopulatedFields[]
  >([]);
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [preloadedAttributeNames, setPreloadedAttributeNames] = useState<
    Record<string, string>
  >({});
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [sizes, setSizes] = useState<ISizes[]>([]);

  const router = useRouter();
  const form = useForm<IProduct>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      vendorId: "",
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

  // * price handling
  const mrp = form.watch("mrp");
  const landingPrice = form.watch("landingPrice");
  const gstType = form.watch("gstType");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const gstRate = form.watch("gstRate");

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
  const { fields, replace } = useFieldArray({
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
    for (const id in preloadedAttributeNames) {
      map.set(id, preloadedAttributeNames[id]);
    }
    if (selectedSecondaryCategory?.attributes) {
      selectedSecondaryCategory.attributes.forEach((attr) => {
        if (attr._id) map.set(attr._id.toString(), attr.name);
      });
    }
    attributes.forEach((attr) => {
      const key = attr._id?.toString();
      if (key && !map.has(key)) map.set(key, attr.name);
    });
    return map;
  }, [selectedSecondaryCategory, attributes, preloadedAttributeNames]);

  useEffect(() => {
    if (selectedSecondaryCategoryId) {
      const selectedCategory = secondaryCategory.find(
        (cat) =>
          cat._id === selectedSecondaryCategoryId ||
          cat.id === selectedSecondaryCategoryId
      );
      if (selectedCategory) {
        const currentAttributes = form.getValues("attributes");
        // Only set initial attributes if none exist
        if (currentAttributes.length === 0) {
          const initialAttributes = selectedCategory.attributes.map((attr) => ({
            attributeId: attr._id,
            value: "",
          }));
          replace(initialAttributes);
        }
      }
    }
  }, [selectedSecondaryCategoryId, secondaryCategory, form, replace]);

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
        const response = await fetch(`/api/vendor/products/${params.id}`);
        const data = await response.json();

        if (data.success) {
          const product = data.data;

          // Handle productSize data - preserve the complete pricing objects
          const productSizeData = product.productSize
            ? product.productSize.map((sizePrice: any) => ({
                ...sizePrice,
                // Ensure sizeId is a string (handle both populated and unpopulated cases)
                sizeId:
                  typeof sizePrice.sizeId === "string"
                    ? sizePrice.sizeId
                    : sizePrice.sizeId?._id || sizePrice.sizeId,
              }))
            : [];

          const currentVendorId = form.getValues("vendorId");
          // Set form values with null checks
          form.reset({
            ...product,
            slug: product.slug || generateSlug(product.productName),
            parentCategory: product.parentCategory?._id || "",
            primaryCategory: product.primaryCategory?._id || "",
            secondaryCategory: product.secondaryCategory?._id || "",
            brands: product.brands?._id || "",
            productSize: productSizeData, // Keep the complete size pricing data
            vendorId: currentVendorId || product.vendorId || "",
          });

          // If the product already has attributes, seed them to the field array
          if (
            Array.isArray(product.attributes) &&
            product.attributes.length > 0
          ) {
            const nameMap: Record<string, string> = {};
            const normalized = product.attributes.map(
              (a: {
                attributeId: string | { _id?: string; name?: string };
                value: string;
              }) => {
                const id =
                  typeof a.attributeId === "string"
                    ? a.attributeId
                    : a.attributeId?._id || "";
                const nm =
                  typeof a.attributeId === "string"
                    ? undefined
                    : a.attributeId?.name;
                if (id && nm) nameMap[id] = nm;
                return { attributeId: id, value: a.value || "" } as {
                  attributeId: string;
                  value: string;
                };
              }
            );
            replace(normalized);
            setPreloadedAttributeNames(nameMap);
          }
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
  }, [params.id, form, replace]);

  // * data submission
  const onSubmit = async (data: IProduct) => {
    try {
      setIsLoading(true);

      const userResponse = await fetch("/api/vendor/current");
      const userData = await userResponse.json();

      if (userData.success && userData.data && userData.data._id) {
        data.vendorId = userData.data._id;
      } else {
        console.error("Failed to get vendor ID from response", userData);
        toast({
          title: "Error",
          description: "Could not determine vendor ID",
          variant: "destructive",
        });
        return;
      }

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
        slug: data.slug,
        productCoverImage: coverImageId,
        productImages: productImageIds,
        vendorId: data.vendorId,
      };
      const response = await fetch(`/api/vendor/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Update failed");
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      router.push("/vendor/products");
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
        const [dropdownResponse, brandResponse, sizesResponse] =
          await Promise.all([
            getAllDropdownData(),
            getAllBrandsLegacy(),
            getAllSizesLegacy(),
          ]);

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
          setBrands(
            Array.isArray(brandResponse.data)
              ? brandResponse.data
              : [brandResponse.data]
          );
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

  useEffect(() => {
    // This effect runs after isLoading changes to false (product load complete)
    if (!isLoading) {
      const currentVendorId = form.getValues("vendorId");

      if (!currentVendorId) {
        // If vendorId is still not set, fetch it again
        const fetchVendorId = async () => {
          try {
            const userResponse = await fetch("/api/vendor/current");
            const userData = await userResponse.json();

            if (userData.success && userData.data && userData.data._id) {
              form.setValue("vendorId", userData.data._id);
              console.log("Vendor ID re-set:", userData.data._id);
            }
          } catch (error) {
            console.error("Error re-fetching vendor ID:", error);
          }
        };

        fetchVendorId();
      } else {
        console.log("VendorId already set:", currentVendorId);
      }
    }
  }, [isLoading, form]);

  const productName = form.watch("productName");

  useEffect(() => {
    if (productName) {
      const slug = generateSlug(productName);
      form.setValue("slug", slug);
    }
  }, [productName, form]);

  // Add this near the top of your component
  const vendorId = form.watch("vendorId");
  useEffect(() => {
    console.log("Current vendorId in form:", vendorId);
  }, [vendorId]);

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
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("Form validation errors:", errors); // Add this line
          toast({
            title: "Error",
            description: "Please check all required fields",
            variant: "destructive",
          });
        })}
        className="space-y-8"
      >
        <Input type="hidden" {...form.register("vendorId")} />
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
                    {...field}
                    placeholder="Enter product quantity"
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

        {/* Pricing Configuration */}
        <SizePricing
          control={form.control}
          sizes={sizes}
          setValue={form.setValue}
        />

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
          <Button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Product"}
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

export default EditProductsForm;
