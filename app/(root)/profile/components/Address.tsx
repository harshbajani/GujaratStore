import React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  addAddress,
  deleteAddress,
  updateAddress,
} from "@/lib/actions/address.actions";
import { Address as deliveryAddress } from "@/lib/validations";
import AddressDialog from "@/lib/forms/addressForm";
import { useUserDetails } from "@/hooks/useUserDetails";
import Loader from "@/components/Loader";

type DeliveryAddress = z.infer<typeof deliveryAddress>;

const Address = () => {
  //  * useStates and hooks
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(
    null
  );
  const { user, isLoading, error, refetch } = useUserDetails();
  const { toast } = useToast();

  // * Address Data submission
  const handleAddressSubmit = async (formData: DeliveryAddress) => {
    try {
      let response;
      if (isEditing && editingAddress) {
        // * Update existing address
        response = await updateAddress(editingAddress._id!, formData);
      } else {
        // * Add new address
        response = await addAddress(formData);
      }

      if (response.success) {
        await refetch(); // * Refetch user data to get updated address
        toast({
          title: "Success",
          description: isEditing
            ? "Address updated successfully"
            : "Address added successfully",
        });
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process address",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting address:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  //  * Delete the address
  const handleAddressDelete = async (_id: string) => {
    try {
      const response = await deleteAddress(_id);
      if (response.success) {
        await refetch(); // * Refetch user data to reflect deletion
        toast({
          title: "Success",
          description: "Address deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete address",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: DeliveryAddress): string => {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading user details: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Address</h2>
        <Button
          variant="outline"
          className="text-red-600 border-red-600"
          onClick={() => {
            setIsEditing(false);
            setEditingAddress(null);
            setIsDialogOpen(true);
          }}
        >
          + ADD NEW ADDRESS
        </Button>
      </div>

      <div className="space-y-4">
        {user?.addresses && user.addresses.length > 0 ? (
          user.addresses.map((address) => (
            <AddressCard
              key={address._id}
              type={address.type}
              name={address.name}
              contact={address.contact}
              address={formatAddress(address)}
              onEdit={() => {
                setIsEditing(true);
                setEditingAddress(address);
                setIsDialogOpen(true);
              }}
              onDelete={() => handleAddressDelete(address._id!)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No addresses saved yet
          </div>
        )}
      </div>

      <AddressDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={isEditing}
        editingAddress={editingAddress}
        onSubmit={handleAddressSubmit}
      />
    </div>
  );
};

const AddressCard: React.FC<AddressCardProps> = ({
  type,
  name,
  contact,
  address,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="p-4 relative">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="px-2 py-1 bg-gray-100 text-sm rounded capitalize">
            {type}
          </span>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-gray-600">{contact}</p>
            <p className="text-sm text-gray-600 mt-2">{address}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default Address;
