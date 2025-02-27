"use client";

import { Users } from "lucide-react";
import { withVendorProtection } from "../../HOC";

const CustomersPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <Users className="text-brand" size={30} />
        <h1 className="h1">Customers</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default withVendorProtection(CustomersPage);
