import AddProductsForm from "@/lib/forms/admin/product/addProductsForm";
import { ShoppingCart } from "lucide-react";
import React from "react";

const AddProductsPage = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-brand" size={30} />
        <h1 className="h1">Add Products</h1>
      </div>
      <div className="p-2 bg-white border rounded-md">
        <AddProductsForm />
      </div>
    </div>
  );
};

export default AddProductsPage;
