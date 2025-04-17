import EditProductsForm from "@/lib/forms/admin/product/editProductForm";
import { ShoppingCart } from "lucide-react";
import React from "react";

const EditProductsPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-brand" size={30} />
        <h1 className="h1">Edit Products</h1>
      </div>
      <div className="p-2 bg-white border rounded-md">
        <EditProductsForm />
      </div>
    </div>
  );
};

export default EditProductsPage;
