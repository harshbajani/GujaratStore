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
import { createBlog, getBlogById } from "@/lib/actions/blog.actions";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/Loader";
import { useParams } from "next/navigation";
import Link from "next/link";

type BlogFormData = z.infer<typeof blogSchema>;

const EditBlog = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postImage, setPostImage] = useState<string | null>(null);
  const { id } = useParams();

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      imageId: "",
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
        // Create a base64 string from the uploaded file
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPostImage(base64String);
        };
        reader.readAsDataURL(file);

        onChange(data.fileId);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const result = await createBlog(formData);

      if (result.success) {
        form.reset();
        setPostImage(null);
        // Add success notification or redirect here
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Add error notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const blog = await getBlogById(id as string);
        if (blog) {
          // Set the base64 image directly
          if (blog.image) {
            setPostImage(`data:image/jpeg;base64,${blog.image}`);
          }

          form.reset({
            imageId: blog.image || "",
            user: blog.user || "",
            date: blog.date || "",
            heading: blog.heading || "",
            description: blog.description || "",
            category: blog.category || "",
            metaTitle: blog.metaTitle || "",
            metaDescription: blog.metaDescription || "",
            metaKeywords: blog.metaKeywords || "",
          });
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="imageId"
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              <Link href="/vendor/blogs">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default EditBlog;
