"use client";
import { createBrand } from "@/lib/actions/brand.actions";
import { brandSchema } from "@/lib/validations";
import { IBrand } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const AddBrandForm = () => {
  // * useStates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postImage, setPostImage] = useState("");
  const [imageId, setImageId] = useState("");
  const [vendorId, setVendorId] = useState("");
  // * hooks
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<IBrand>({
    resolver: zodResolver(brandSchema),
  });

  // * image upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setPostImage(URL.createObjectURL(file));
          setImageId(data.fileId);
          onChange(data.fileId); // Update the form with the file ID
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };
  // * brand submission
  const handleSubmit = async (data: IBrand) => {
    setIsSubmitting(true);
    try {
      const formData = {
        ...data,
        imageId: imageId,
      };
      const result = await createBrand(formData, vendorId);
      if (result.success) {
        form.reset({
          name: "",
          vendorId: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
        });
        setPostImage("");
        setImageId("");
        router.push("/vendor/brand");
        toast({
          title: "Success",
          description: "Brand added successfully",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to add brand",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          setVendorId(userData.data._id);
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
    <section className="sm:px-5 md:px-1 lg:px-2">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="imageId" // Changed from 'image' to 'imageId'
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".jpeg, .png, .jpg"
                        onChange={(e) => handleFileUpload(e, onChange)}
                        defaultValue={value}
                        {...field}
                      />
                    </FormControl>
                    {postImage && (
                      <Image
                        src={postImage}
                        alt="Preview"
                        height={200}
                        width={200}
                        style={{ maxWidth: "200px" }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter brand name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            <div className="flex flex-row mt-2 gap-2">
              <Button
                type="submit"
                className="primary-btn "
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/vendor/brand">Cancel</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default AddBrandForm;
