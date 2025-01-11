import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserDetails } from "@/hooks/useUserDetails";
import React from "react";

const Profile = () => {
  const userDetails = useUserDetails();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="space-y-4">
        <div>
          <Label className="block text-sm font-medium mb-1">Name</Label>
          <Input
            type="text"
            className="w-full p-2 border rounded-md"
            defaultValue={userDetails.user?.name || ""}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">Email</Label>
          <Input
            type="email"
            className="w-full p-2 border rounded-md"
            defaultValue={userDetails.user?.email || ""}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">Contact No.</Label>
          <Input
            type="tel"
            className="w-full p-2 border rounded-md"
            defaultValue={userDetails.user?.phone || ""}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
