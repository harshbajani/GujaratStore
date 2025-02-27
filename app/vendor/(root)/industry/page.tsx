"use client";
import { Building } from "lucide-react";
import { withVendorProtection } from "../../HOC";

const IndustriesPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <Building className="text-brand" size={30} />
        <h1 className="h1">Industries</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default withVendorProtection(IndustriesPage);
