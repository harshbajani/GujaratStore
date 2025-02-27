"use client";

import { ClipboardList } from "lucide-react";
import { withVendorProtection } from "../../HOC";

const OrdersPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <ClipboardList className="text-brand" size={30} />
        <h1 className="h1">Orders</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default withVendorProtection(OrdersPage);
