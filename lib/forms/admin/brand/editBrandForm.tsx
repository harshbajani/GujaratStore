"use client";
import { getBrandById } from "@/lib/actions/brand.actions";
import { brandSchema } from "@/lib/validations";
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
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { useToast } from "@/hooks/use-toast";
import { Types } from "mongoose";

const EditBrandForm = () => {
  // * useStates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postImage, setPostImage] = useState("");
  const [imageId, setImageId] = useState("");
  // * hooks
  const { id } = useParams();
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
  // * brand update submission
  const handleSubmit = async (data: IBrand) => {
    setIsSubmitting(true);
    try {
      const formData = { ...data, imageId };

      const response = await fetch(`/api/admin/brand/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        form.reset(); // Clear the form
        router.push("/admin/brand");
        toast({
          title: "Success",
          description: "Brand edited successfully.",
        });
        setPostImage("");
        setImageId("");
      } else {
        throw new Error(result.message || "Failed to edit brand");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to edit brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // * fetching brand data to populate fields
  useEffect(() => {
    const fetchBrand = async () => {
      if (!id || !Types.ObjectId.isValid(id as string)) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getBrandById(id as string);
        const brand =
          response && response.data
            ? Array.isArray(response.data)
              ? response.data[0]
              : response.data
            : undefined;
        if (brand) {
          // Set the base64 image directly
          if (brand.imageId) {
            setPostImage(`/api/files/${brand.imageId}`);
          }

          form.reset({
            imageId: brand.imageId || "",
            name: brand.name || "",
            metaTitle: brand.metaTitle || "",
            metaKeywords: brand.metaKeywords || "",
            metaDescription: brand.metaDescription || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrand();
  }, [id, form]);

  if (isLoading) {
    <Loader />;
  }

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
                <Link prefetch href="/admin/brand">
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default EditBrandForm;
