/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { blogSchema } from "@/lib/validations";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getBlogById } from "@/lib/actions/blog.actions";

import Image from "next/image";
import { convertToBase64 } from "@/lib/utils";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";

type BlogFormData = z.infer<typeof blogSchema>;

const EditBlogPage = () => {
  // * useStates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postImage, setPostImage] = useState<string | null>(null); //* Store the image for preview

  // * hooks
  const { id } = useParams();
  const router = useRouter();

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      // image: "",
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

  //* Handle image file upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setPostImage(base64);
      onChange(base64); // Update form data with the base64 string
    }
  };

  // * form submission
  const onSubmit: SubmitHandler<BlogFormData> = async (data) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      // await updateBlog(id as string, data);
      console.log("Blog updated successfully");
      router.push("/admin/blog"); // Redirect to blog list page
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // * useEffects
  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      try {
        const blog = await getBlogById(id as string);
        if (blog) {
          form.reset({
            // image: blog.image,
            user: blog.user,
            date: blog.date,
            heading: blog.heading,
            description: blog.description,
            category: blog.category,
            metaTitle: blog.metaTitle || "",
            metaDescription: blog.metaDescription || "",
            metaKeywords: blog.metaKeywords || "",
          });
          setPostImage(blog.image);
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
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
      <h1 className="text-black text-2xl font-semibold sm:mb-5 md:mb-2">
        Edit Blog
      </h1>
      <div className="bg-white border border-gray-300 rounded-xl p-6 text-black">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="imageId"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".jpeg, .png, .jpg"
                        {...field}
                        onChange={(e) => handleFileUpload(e, onChange)}
                      />
                    </FormControl>
                    {postImage && (
                      <Image
                        src={postImage} //* Display the image (either base64 or URL)
                        alt="Preview"
                        height={200}
                        width={200}
                        style={{ maxWidth: "200px" }}
                      />
                    )}
                    <FormMessage>
                      {/* {form.formState.errors.image?.message} */}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Other form fields */}
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="User name"
                        className="mb-4"
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.user?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="mb-4" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.date?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heading</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        placeholder="Blog heading"
                        className="mb-4"
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.heading?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        placeholder="Blog category"
                        className="mb-4"
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.category?.message}
                    </FormMessage>
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
                      {/* Use React Quill for rich text editing */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} placeholder="Meta Title" />
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
                      <Input
                        type="text"
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
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Meta Description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-4">
              <Button type="button" onClick={() => router.push("/admin/blog")}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="ml-2"
                disabled={isSubmitting}
                onClick={() => router.push("/admin/blog")}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default EditBlogPage;
