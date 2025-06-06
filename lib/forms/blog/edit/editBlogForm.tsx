/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { blogSchema } from "@/lib/validations";
import Image from "next/image";
import { updateBlog, getBlogById } from "@/lib/actions/blog.actions";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/Loader";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type BlogFormData = z.infer<typeof blogSchema>;

const EditBlog = () => {
  // * useStates and hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [vendorId, setVendorId] = useState("");
  const { id } = useParams();
  const router = useRouter();

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      imageId: "",
      vendorId: "",
      user: "",
      date: "",
      heading: "",
      description: "",
      category: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
    },
  });
  // * file upload function
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Set the preview image using URL.createObjectURL
        setPostImage(URL.createObjectURL(file));

        // Set the imageId directly
        onChange(data.fileId);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  // * data submission
  const handleSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      // Handle image ID
      if (!data.imageId && existingImageId) {
        data.imageId = existingImageId;
      }
      if (data.imageId && data.imageId.startsWith("/")) {
        data.imageId = existingImageId || "";
      }

      const userResponse = await fetch("/api/vendor/current");
      const userData = await userResponse.json();

      if (!userData.success || !userData.data?._id) {
        throw new Error("Failed to get vendor ID");
      }

      const result = await updateBlog(id as string, userData.data._id, {
        ...data,
        vendorId: userData.data._id, // Include vendorId in update data
      });

      if (!result.success) {
        throw new Error(result.success || "Failed to update blog");
      }

      toast({
        title: "Success",
        description: "Blog edited successfully.",
      });

      router.push("/vendor/blogs");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to edit blog.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // * Update fetchBlog to set vendorId from current vendor
  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch blog data
        const blog = await getBlogById(id as string);

        // Fetch current vendor
        const userResponse = await fetch("/api/vendor/current");
        const userData = await userResponse.json();

        if (userData.success && userData.data?._id) {
          // Set the vendorId in form and state
          setVendorId(userData.data._id);
          form.setValue("vendorId", userData.data._id);
        }

        if (blog) {
          // Set the original imageId
          setExistingImageId(blog.imageId);

          // Fetch and set image preview
          if (blog.imageId) {
            const response = await fetch(`/api/files/${blog.imageId}`);
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setPostImage(imageUrl);
            setImagePreviewUrl(imageUrl);
          }

          // Reset form with blog data and current vendor ID
          form.reset({
            ...blog,
            vendorId: userData.data._id, // Use current vendor's ID
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch blog data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();

    return () => {
      if (postImage) {
        URL.revokeObjectURL(postImage);
      }
    };
  }, [id, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <section className="sm:px-5 md:px-1 lg:px-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="imageId"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, onChange)}
                    />
                  </FormControl>
                  {postImage && (
                    <div className="relative w-full h-[200px] mt-2">
                      <Image
                        src={postImage}
                        alt="Preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="User" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <FormField
              control={form.control}
              name="heading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heading</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Heading" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Category" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <ReactQuill
                      theme="snow"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
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
                  <FormLabel>Meta Keywords</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="keyword1, keyword2, keyword3"
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
              <FormItem className="mt-4">
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
              <Link prefetch href="/vendor/blogs">
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default EditBlog;
