"use client";
import EditAttributeForm from "@/lib/forms/attribute/editAttributeForm";
import { Tag } from "lucide-react";

const EditAttribute = () => {
  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-2">
        <Tag className="text-brand" size={30} />
        <h1 className="h1">Edit Attribute</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditAttributeForm />
      </div>
    </div>
  );
};

export default EditAttribute;
