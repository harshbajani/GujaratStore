"use client";

import EditBlog from "@/lib/forms/admin/blog/edit/page";
import { PencilLine } from "lucide-react";
import React from "react";

const EditBlogPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-row items-center mb-3 gap-2">
        <PencilLine className="text-brand" size={30} />
        <h1 className="h1">Edit Blog</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditBlog />
      </div>
    </div>
  );
};

export default EditBlogPage;
