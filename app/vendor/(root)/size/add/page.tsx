import AddSizeForm from "@/lib/forms/size/addSize";
import { Ruler } from "lucide-react";

const AddAttribute = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Ruler className="text-brand" size={30} />
        <h1 className="h1">Add Size</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <AddSizeForm />
      </div>
    </div>
  );
};

export default AddAttribute;
