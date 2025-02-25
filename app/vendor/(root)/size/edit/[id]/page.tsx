import EditSizeForm from "@/lib/forms/size/editSize";
import { Ruler } from "lucide-react";

const EditSize = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Ruler className="text-brand" size={30} />
        <h1 className="h1">Edit Size</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditSizeForm />
      </div>
    </div>
  );
};

export default EditSize;
