"use client";
import EditParentCategoryForm from "@/lib/forms/parentCategory/editParentCategoryForm";
import { Tag } from "lucide-react";
import { useParams } from "next/navigation";

const EditParentCategory = () => {
  const { id } = useParams();
  const parentCategoryId = Array.isArray(id) ? id[0] : id || "";
  return (
    <div className="p-2 ">
      <div className="flex items-center gap-2">
        <Tag className="text-brand" size={30} />
        <h1 className="h1">Edit Parent Category</h1>
      </div>
      <div className="p-2 bg-white border rounded-md ">
        <EditParentCategoryForm parentCategoryId={parentCategoryId} />
      </div>
    </div>
  );
};

export default EditParentCategory;
