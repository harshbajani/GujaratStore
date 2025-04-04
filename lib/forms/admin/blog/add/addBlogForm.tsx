"use client";
import React, { useState } from "react";
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
import { createBlog } from "@/lib/actions/admin/blog.actions";

//* Dynamically import React Quill (it won't run server-side)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "quill/dist/quill.snow.css";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type BlogFormData = z.infer<typeof blogSchema>;

const AddBlog = () => {
  // * useStates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postImage, setPostImage] = useState("");
  const [imageId, setImageId] = useState("");

  // * hooks
  const router = useRouter();
  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
  });

  // * functions
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
  // * form submission
  const handleSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value || "");
      });
      formData.set("imageId", imageId); // Ensure imageId is set

      const result = await createBlog(formData);

      if (result.success) {
        form.reset({
          heading: "",
          user: "",
          date: "",
          description: "",
          category: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
        });
        setPostImage("");
        setImageId("");
        router.push("/vendor/blogs"); // Redirect after success
        toast({
          title: "Success",
          description: "Blog added successfully.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to add blog.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <div className="grid grid-cols-1  gap-2">
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
                <Link href="/vendor/blogs">Cancel</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default AddBlog;
