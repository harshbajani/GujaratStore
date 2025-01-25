import AddAttributeForm from "@/lib/forms/attribute/addAttributeForm";
import { Tag } from "lucide-react";

const AddAttribute = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Tag className="text-brand" size={30} />
        <h1 className="h1">Add Attribute</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddAttributeForm />
      </div>
    </div>
  );
};

export default AddAttribute;
