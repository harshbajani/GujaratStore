"use client";
import AddPrimaryCategoryForm from "@/lib/forms/admin/primaryCategory/addPrimaryCategory";
import { LayoutPanelLeft } from "lucide-react";
import React from "react";

const AddPrimaryCategoryPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Add Primary Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddPrimaryCategoryForm />
      </div>
    </div>
  );
};

export default AddPrimaryCategoryPage;
