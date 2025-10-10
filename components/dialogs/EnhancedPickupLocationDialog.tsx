"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Building, Plus } from "lucide-react";
import PickupAddressManager from "@/components/admin/PickupAddressManager";
import { PickupLocationData } from "./PickupLocationDialog";

interface EnhancedPickupLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    pickupLocationName?: string,
    customData?: PickupLocationData
  ) => void;
  onSkip: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const EnhancedPickupLocationDialog: React.FC<
  EnhancedPickupLocationDialogProps
> = ({
  open,
  onOpenChange,
  onConfirm,
  onSkip,
  isLoading = false,
  title = "Select Pickup Location",
  description = "Choose an existing pickup location or create a new one for this order.",
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("existing");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [newLocationCreated, setNewLocationCreated] = useState<string>("");

  const handleExistingLocationConfirm = () => {
    if (!selectedLocation) {
      return;
    }
    onConfirm(selectedLocation);
  };

  const handleUseDefault = () => {
    onSkip(); // This will use the default pickup location
  };

  const handleLocationCreated = (locationName: string) => {
    setNewLocationCreated(locationName);
    setSelectedTab("existing");
    setSelectedLocation(locationName);
    
    // Auto-select the newly created location
    setTimeout(() => {
      setSelectedLocation(locationName);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="py-4">
          <Tabs 
            value={selectedTab} 
            onValueChange={(value) => {
              setSelectedTab(value);
              if (value === "create") {
                setNewLocationCreated(""); // Clear success message when switching to create tab
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Select Existing
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="mt-4">
              <PickupAddressManager
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                showSelector={true}
                showManagement={false}
                key={`existing-${newLocationCreated}`} // Force refresh when new location created
              />

              {newLocationCreated && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ New pickup location &quot;{newLocationCreated}&quot;
                    created successfully!
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    You can now select it from the dropdown above.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Create New Pickup Location
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Create a new pickup location that will be saved in
                    Shiprocket and can be reused for future orders. This
                    location will be added to your account permanently.
                  </p>
                </div>

                <PickupAddressManager
                  selectedLocation=""
                  onLocationSelect={() => {}}
                  showSelector={false}
                  showManagement={true}
                  onLocationCreated={handleLocationCreated}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseDefault}
            disabled={isLoading}
          >
            Use Default Location
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            {selectedTab === "existing" && (
              <Button
                type="button"
                onClick={handleExistingLocationConfirm}
                disabled={isLoading || !selectedLocation}
                className="bg-brand hover:bg-brand/90"
              >
                {isLoading ? "Processing..." : "Use Selected Location"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
