"use client";
import { withVendorProtection } from "@/app/vendor/HOC";
import { LayoutPanelLeft } from "lucide-react";
import React from "react";

const ParentCategoryPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Parent Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default withVendorProtection(ParentCategoryPage);
