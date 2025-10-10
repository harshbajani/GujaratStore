"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2 } from "lucide-react";

export interface PickupLocationData {
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}

interface PickupLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pickupLocation: PickupLocationData) => void;
  onSkip: () => void;
  isLoading?: boolean;
  defaultData?: Partial<PickupLocationData>;
  title?: string;
  description?: string;
}

export const PickupLocationDialog: React.FC<PickupLocationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onSkip,
  isLoading = false,
  defaultData = {},
  title = "Set Pickup Location",
  description = "Please provide the pickup location details for this order. This is where Shiprocket will collect the package from.",
}) => {
  const [formData, setFormData] = useState<PickupLocationData>({
    name: defaultData.name || "",
    email: defaultData.email || "",
    phone: defaultData.phone || "",
    address: defaultData.address || "",
    address_2: defaultData.address_2 || "",
    city: defaultData.city || "",
    state: defaultData.state || "",
    country: defaultData.country || "India",
    pin_code: defaultData.pin_code || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Contact person name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/[^0-9]/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.pin_code.trim()) {
      newErrors.pin_code = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.pin_code)) {
      newErrors.pin_code = "PIN code must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  const handleInputChange = (field: keyof PickupLocationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Person Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Contact Person</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Contact person name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="10-digit phone number"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Pickup Address</h4>
            
            <div>
              <Label htmlFor="address">Address Line 1 *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street address, building name, etc."
                rows={2}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address_2">Address Line 2 (Optional)</Label>
              <Input
                id="address_2"
                value={formData.address_2}
                onChange={(e) => handleInputChange("address_2", e.target.value)}
                placeholder="Landmark, nearby area (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="State"
                  className={errors.state ? "border-red-500" : ""}
                />
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pin_code">PIN Code *</Label>
                <Input
                  id="pin_code"
                  value={formData.pin_code}
                  onChange={(e) => handleInputChange("pin_code", e.target.value)}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  className={errors.pin_code ? "border-red-500" : ""}
                />
                {errors.pin_code && (
                  <p className="text-red-500 text-xs mt-1">{errors.pin_code}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="India"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
          >
            Use Default Location
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-brand hover:bg-brand/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Ship"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
