"use client";

import { PieChart } from "lucide-react";
import { withVendorProtection } from "../../HOC";

const DashboardPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <PieChart className="text-brand" size={30} />
        <h1 className="h1">Dashboard</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen shadow-md">
        dashboard componenets and functions to calculate and display data Store
      </div>
    </div>
  );
};

export default withVendorProtection(DashboardPage);
