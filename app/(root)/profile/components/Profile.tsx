import { useUserDetails } from "@/hooks/useUserDetails";
import React from "react";

const Profile = () => {
  const userDetails = useUserDetails();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            defaultValue={userDetails.user?.name || ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md"
            defaultValue={userDetails.user?.email || ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact No.</label>
          <input
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
