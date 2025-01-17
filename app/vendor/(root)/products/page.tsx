"use client";

import { ShoppingCart } from "lucide-react";

const ProductsPage = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-brand" size={30} />
        <h1 className="h1">Products</h1>
      </div>
      <div className="p-2 bg-white border rounded-md min-h-screen">
        dashboard componenets and functions to calculate and display data
      </div>
    </div>
  );
};

export default ProductsPage;
