import { LayoutPanelLeft } from "lucide-react";
import AddParentCategoryForm from "@/lib/forms/parentCategory/addParentCategoryForm";

const AddParentCategory = () => {
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Add Parent Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddParentCategoryForm />
      </div>
    </div>
  );
};

export default AddParentCategory;
