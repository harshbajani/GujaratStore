import { Star } from "lucide-react";
import AddBrandForm from "@/lib/forms/brand/addBrandForm";

const AddBrand = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Star className="text-brand" size={30} />
        <h1 className="h1">Add Brand </h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddBrandForm />
      </div>
    </div>
  );
};

export default AddBrand;
