import { Star } from "lucide-react";
import EditBrandForm from "@/lib/forms/brand/editBrandForm";

const EditBrand = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Star className="text-brand" size={30} />
        <h1 className="h1">Edit Brand </h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditBrandForm />
      </div>
    </div>
  );
};

export default EditBrand;
