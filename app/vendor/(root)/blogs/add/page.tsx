"use client";
import { withVendorProtection } from "@/app/vendor/HOC";
import AddBlog from "@/lib/forms/blog/add/addBlogForm";
import { PencilLine } from "lucide-react";
import React from "react";

const AddBlogPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-row items-center mb-3  gap-2">
        <PencilLine className="text-brand" size={30} />
        <h1 className="h1">Add Blog</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddBlog />
      </div>
    </div>
  );
};

export default withVendorProtection(AddBlogPage);
