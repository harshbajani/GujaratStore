"use client";
import EditAttributeForm from "@/lib/forms/attribute/editAttributeForm";
import { Tag } from "lucide-react";
import { useParams } from "next/navigation";

const AddAttribute = () => {
  const { id } = useParams();
  const attributeId = Array.isArray(id) ? id[0] : id || "";
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <Tag className="text-brand" size={30} />
        <h1 className="h1">Edit Attribute</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditAttributeForm attributeId={attributeId} />
      </div>
    </div>
  );
};

export default AddAttribute;
