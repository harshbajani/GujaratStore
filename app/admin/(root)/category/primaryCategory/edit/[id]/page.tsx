"use client";
import EditPrimaryCategoryForm from "@/lib/forms/admin/primaryCategory/editPrimaryCategory";
import { LayoutPanelLeft } from "lucide-react";
import React from "react";

const EditPrimaryCategoryPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Edit Primary Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditPrimaryCategoryForm />
      </div>
    </div>
  );
};

export default EditPrimaryCategoryPage;
