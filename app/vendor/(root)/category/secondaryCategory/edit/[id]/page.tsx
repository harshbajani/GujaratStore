"use client";
import { withVendorProtection } from "@/app/vendor/HOC";
import EditSecondaryCategoryForm from "@/lib/forms/secondaryCategory/editSecondaryCategory";
import { LayoutPanelLeft } from "lucide-react";
import React from "react";

const EditSecondaryCategoryPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Edit Secondary Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditSecondaryCategoryForm />
      </div>
    </div>
  );
};

export default withVendorProtection(EditSecondaryCategoryPage);
