"use client";
import { PencilLine } from "lucide-react";
import { withVendorProtection } from "../../HOC";

const BlogsPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <PencilLine className="text-brand" size={30} />
        <h1 className="h1">Blogs</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default withVendorProtection(BlogsPage);
