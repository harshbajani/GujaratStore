/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Truck,
  Building,
  Phone,
  Mail,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  phone_verified: boolean;
  email_verified: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PickupAddressManagerProps {
  selectedLocation?: string;
  onLocationSelect?: (locationName: string) => void;
  showSelector?: boolean;
  showManagement?: boolean;
  onLocationCreated?: (locationName: string) => void;
}

const PickupAddressManager: React.FC<PickupAddressManagerProps> = ({
  selectedLocation,
  onLocationSelect,
  showSelector = true,
  showManagement = true,
  onLocationCreated,
}) => {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    pickup_location: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    address_2: "",
    city: "",
    state: "",
    country: "India",
    pin_code: "",
  });

  useEffect(() => {
    if (showSelector || showManagement) {
      fetchPickupLocations();
    }
  }, [showSelector, showManagement]);

  const fetchPickupLocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/admin/shiprocket/pickup-locations?action=list"
      );
      const data = await response.json();
      console.log("Pickup locations API response:", data);

      if (data.success && data.data) {
        // Normalize API response and map to PickupLocation[]
        const outer = data.data; // could be array or object
        const inner = Array.isArray(outer) ? undefined : outer?.data;

        // Determine the source array of addresses
        let addresses: any[] = [];
        if (Array.isArray(outer)) {
          addresses = outer;
        } else if (Array.isArray(inner?.shipping_address)) {
          addresses = inner.shipping_address;
        } else if (Array.isArray(outer?.shipping_address)) {
          addresses = outer.shipping_address;
        } else if (outer && typeof outer === "object" && outer.pickup_location) {
          addresses = [outer];
        } else if (inner && typeof inner === "object" && inner.pickup_location) {
          addresses = [inner];
        } else if (Array.isArray(inner)) {
          addresses = inner;
        } else {
          console.warn("Unexpected pickup locations data format:", data.data);
          addresses = [];
        }

        // Map API addresses to our interface shape
        // Note: Shiprocket API has mixed field mapping:
        // - a.address = actual address line 1
        // - a.address_2 = actual city
        // - a.city = actual address line 2/locality
        const locations: PickupLocation[] = addresses.map((a: any) => ({
          id: a.id ?? a.address_id ?? a.rto_address_id ?? Math.floor(Math.random() * 1e9),
          pickup_location:
            a.pickup_location ?? a.warehouse_code ?? a.tag_value ?? a.tag ?? "Unknown",
          name: a.name ?? a.vendor_name ?? a.company_name ?? "",
          email: a.email ?? "",
          phone: a.phone ?? a.alternate_phone ?? "",
          address: a.address ?? "", // "605, fortune"
          address_2: a.city ?? "", // "Gita Nagar," (actual locality/address_2)
          city: a.address_2 ?? "", // "Vapi" (actual city)
          state: a.state ?? "",
          country: a.country ?? "India",
          pin_code: (a.pin_code ?? "").toString(),
          phone_verified: Boolean(a.phone_verified === 1 || a.phone_verified === true),
          email_verified: Boolean(a.email_verified === 1 || a.email_verified === true),
          is_default: Boolean(a.is_primary_location === 1 || a.is_default === true),
          created_at: a.created_at ?? "",
          updated_at: a.updated_at ?? "",
        }));

        setPickupLocations(locations);
      } else {
        console.error("Failed to fetch pickup locations:", data.error);
        setPickupLocations([]); // Ensure it's always an array
        toast({
          title: "Error",
          description: data.error || "Failed to fetch pickup locations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching pickup locations:", error);
      setPickupLocations([]); // Ensure it's always an array on error
      toast({
        title: "Error",
        description: "Failed to fetch pickup locations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    if (
      !formData.pickup_location ||
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pin_code
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/shiprocket/pickup-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-admin",
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Pickup location created successfully!",
        });
        
        // Notify parent component about the new location
        if (onLocationCreated) {
          onLocationCreated(formData.pickup_location);
        }
        
        setShowCreateDialog(false);
        setFormData({
          pickup_location: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          address_2: "",
          city: "",
          state: "",
          country: "India",
          pin_code: "",
        });
        fetchPickupLocations();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create pickup location",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating pickup location:", error);
      toast({
        title: "Error",
        description: "Failed to create pickup location",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!showSelector && !showManagement) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pickup Location Selector */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Select Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={selectedLocation}
                onValueChange={(value) => onLocationSelect?.(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose pickup location..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(pickupLocations) && pickupLocations.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.pickup_location}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{location.pickup_location}</span>
                        {location.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Selected: {selectedLocation}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Address Management */}
      {showManagement && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Pickup Address Management
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPickupLocations}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading pickup locations...</p>
                </div>
              ) : Array.isArray(pickupLocations) && pickupLocations.length > 0 ? (
                <div className="space-y-3">
                  {pickupLocations.map((location) => (
                    <div
                      key={location.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {location.pickup_location}
                            {location.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {location.name}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {location.phone_verified && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Phone ✓
                            </Badge>
                          )}
                          {location.email_verified && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Email ✓
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{location.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{location.email}</span>
                        </div>
                        <div className="col-span-full">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p>{location.address}</p>
                              {location.address_2 && <p>{location.address_2}</p>}
                              <p>
                                {location.city}, {location.state}{" "}
                                {location.pin_code}
                              </p>
                              <p>{location.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pickup locations found</p>
                  <p className="text-sm">Create your first pickup location to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Pickup Location Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Pickup Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_location">
                  Pickup Location Name *
                </Label>
                <Input
                  id="pickup_location"
                  value={formData.pickup_location}
                  onChange={(e) =>
                    handleInputChange("pickup_location", e.target.value)
                  }
                  placeholder="e.g., Main_Warehouse_Mumbai"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier (no spaces, use underscores)
                </p>
              </div>
              <div>
                <Label htmlFor="name">Contact Person Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="9876543210"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street address"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address_2">Address Line 2</Label>
              <Input
                id="address_2"
                value={formData.address_2}
                onChange={(e) => handleInputChange("address_2", e.target.value)}
                placeholder="Apartment, suite, etc."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Mumbai"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Maharashtra"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pin_code">PIN Code *</Label>
                <Input
                  id="pin_code"
                  value={formData.pin_code}
                  onChange={(e) => handleInputChange("pin_code", e.target.value)}
                  placeholder="400001"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLocation} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickupAddressManager;
