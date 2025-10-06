"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface PickupLocationManagerProps {
  vendors: VendorResponse[];
  onRefresh?: () => void;
}

export const PickupLocationManager: React.FC<PickupLocationManagerProps> = ({
  vendors,
  onRefresh,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const handleCreatePickupLocation = async (vendorId: string, vendorName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/shiprocket/pickup-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          vendorId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Pickup location created for ${vendorName}`);
        onRefresh?.();
      } else {
        toast.error(`Failed to create pickup location: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to create pickup location');
      console.error('Error creating pickup location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllPickupLocations = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch('/api/admin/shiprocket/pickup-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-all',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const { synced, errors } = result.data;
        toast.success(`Synced ${synced} pickup locations successfully`);
        
        if (errors.length > 0) {
          toast.error(`${errors.length} errors occurred during sync`);
          console.error('Sync errors:', errors);
        }
        
        onRefresh?.();
      } else {
        toast.error(`Failed to sync pickup locations: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to sync pickup locations');
      console.error('Error syncing pickup locations:', error);
    } finally {
      setSyncingAll(false);
    }
  };

  const getPickupLocationStatus = (vendor: VendorResponse) => {
    if (vendor.shiprocket_pickup_location_added && vendor.shiprocket_pickup_location) {
      return {
        status: 'success' as const,
        message: 'Active',
        location: vendor.shiprocket_pickup_location,
      };
    } else if (!vendor.isVerified) {
      return {
        status: 'warning' as const,
        message: 'Vendor Not Verified',
        location: null,
      };
    } else {
      return {
        status: 'error' as const,
        message: 'Not Created',
        location: null,
      };
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return "bg-green-100 text-green-800";
      case 'warning':
        return "bg-yellow-100 text-yellow-800";
      case 'error':
        return "bg-red-100 text-red-800";
    }
  };

  const verifiedVendors = vendors.filter(vendor => vendor.isVerified);
  const pendingVendors = verifiedVendors.filter(vendor => !vendor.shiprocket_pickup_location_added);

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shiprocket Pickup Locations
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || syncingAll}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {pendingVendors.length > 0 && (
              <Button
                size="sm"
                onClick={handleSyncAllPickupLocations}
                disabled={isLoading || syncingAll}
              >
                <Plus className={`h-4 w-4 mr-2 ${syncingAll ? "animate-spin" : ""}`} />
                {syncingAll ? "Syncing..." : `Sync All (${pendingVendors.length})`}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {vendors.filter(v => v.shiprocket_pickup_location_added).length}
              </div>
              <div className="text-sm text-gray-500">Active Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingVendors.length}
              </div>
              <div className="text-sm text-gray-500">Pending Creation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {vendors.filter(v => !v.isVerified).length}
              </div>
              <div className="text-sm text-gray-500">Unverified Vendors</div>
            </div>
          </div>

          <Separator />

          {/* Vendor List */}
          <div className="space-y-4">
            <h4 className="font-medium">Vendor Pickup Locations</h4>
            
            {vendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No vendors found
              </div>
            ) : (
              <div className="space-y-3">
                {vendors.map((vendor) => {
                  const { status, message, location } = getPickupLocationStatus(vendor);
                  
                  return (
                    <div
                      key={vendor._id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h5 className="font-medium">{vendor.name}</h5>
                            <p className="text-sm text-gray-500">
                              {vendor.store?.storeName} • {vendor.email}
                            </p>
                            {location && (
                              <p className="text-xs text-blue-600 mt-1 font-mono">
                                Location: {location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(status)}
                          {message}
                        </Badge>
                        
                        {vendor.isVerified && !vendor.shiprocket_pickup_location_added && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreatePickupLocation(vendor._id as string, vendor.name)}
                            disabled={isLoading || syncingAll}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
