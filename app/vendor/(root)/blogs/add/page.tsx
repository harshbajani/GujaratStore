"use client";
import { withVendorProtection } from "@/app/vendor/HOC";
import { Button } from "@/components/ui/button";
import AddBlog from "@/lib/forms/blog/add/addBlogForm";
import { ArrowLeft, PencilLine } from "lucide-react";
import Link from "next/link";
import React from "react";

const AddBlogPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex justify-between items-center gap-2 mb-3">
        <div className="flex flex-row items-center  gap-2">
          <PencilLine className="text-brand" size={30} />
          <h1 className="h1">Add Blog</h1>
        </div>
        <Button className="primary-btn" asChild>
          <Link href="/vendor/blogs">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddBlog />
      </div>
    </div>
  );
};

export default withVendorProtection(AddBlogPage);
