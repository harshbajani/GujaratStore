/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Navigation,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EnhancedShippingInfoProps {
  order: IOrder;
  user: any;
  address: any;
}

interface TrackingActivity {
  status: string;
  activity: string;
  location: string;
  date: string;
  time?: string;
}

interface ShippingInfo {
  awb_code?: string;
  courier_name?: string;
  shipping_status?: string;
  pickup_date?: string;
  delivered_date?: string;
  eta?: string;
  last_update?: string;
  shipping_history?: TrackingActivity[];
}

const statusConfig = {
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  "ready to ship": { color: "bg-yellow-100 text-yellow-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
  "out for delivery": {
    color: "bg-orange-100 text-orange-800",
    icon: Navigation,
  },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
  returned: { color: "bg-gray-100 text-gray-800", icon: AlertCircle },
};

const getStatusConfig = (status: string) => {
  return (
    statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      icon: Package,
    }
  );
};

const EnhancedShippingInfo: React.FC<EnhancedShippingInfoProps> = ({
  order,
  user,
  address,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({});

  useEffect(() => {
    if (order.shipping) {
      setShippingInfo({
        awb_code: order.shipping.awb_code,
        courier_name: order.shipping.courier_name,
        shipping_status: order.shipping.shipping_status,
        pickup_date:
          typeof order.shipping.pickup_date === "string"
            ? order.shipping.pickup_date
            : order.shipping.pickup_date?.toISOString(),
        delivered_date:
          typeof order.shipping.delivered_date === "string"
            ? order.shipping.delivered_date
            : order.shipping.delivered_date?.toISOString(),
        eta:
          typeof order.shipping.eta === "string"
            ? order.shipping.eta
            : order.shipping.eta?.toISOString(),
        last_update:
          typeof order.shipping.last_update === "string"
            ? order.shipping.last_update
            : order.shipping.last_update?.toISOString(),
        shipping_history: (order.shipping.shipping_history || []).map(
          (activity: any) => ({
            status: activity.status,
            activity: activity.activity,
            location: activity.location,
            date:
              typeof activity.date === "string"
                ? activity.date
                : activity.date?.toISOString() || "",
            time: activity.time,
          })
        ),
      });
    }
  }, [order]);

  const refreshTrackingInfo = async () => {
    if (!shippingInfo.awb_code && !order.shipping?.shiprocket_order_id) {
      toast({
        title: "Cannot Refresh",
        description: "No tracking information available to refresh",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    try {
      const endpoint = shippingInfo.awb_code
        ? `/api/admin/shiprocket/track/${shippingInfo.awb_code}?type=awb`
        : `/api/admin/shiprocket/track/${order.shipping?.shiprocket_order_id}?type=order`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success && data.tracking) {
        setShippingInfo((prev) => ({
          ...prev,
          ...data.tracking,
          last_update: new Date().toISOString(),
        }));

        toast({
          title: "Tracking Updated",
          description: "Latest shipping information has been fetched",
        });
      } else {
        throw new Error(data.error || "Failed to refresh tracking info");
      }
    } catch (error) {
      console.error("Error refreshing tracking:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not fetch latest tracking information",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openTrackingUrl = () => {
    if (shippingInfo.awb_code) {
      const url = `https://shiprocket.co/tracking/${shippingInfo.awb_code}`;
      window.open(url, "_blank");
    }
  };

  const statusInfo = getStatusConfig(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Shipping Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Shipping Information
            </CardTitle>
            {shippingInfo.awb_code && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTrackingInfo}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <Badge className={statusInfo.color}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
            {shippingInfo.last_update && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-xs text-gray-600">
                  {formatDate(shippingInfo.last_update)}
                </p>
              </div>
            )}
          </div>

          {/* Tracking Details */}
          {shippingInfo.awb_code && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    AWB Number
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{shippingInfo.awb_code}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openTrackingUrl}
                      className="p-1 h-auto"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Courier Partner
                  </p>
                  <p className="text-sm text-gray-900">
                    {shippingInfo.courier_name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Pickup Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDateOnly(shippingInfo.pickup_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Expected Delivery
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDateOnly(shippingInfo.eta)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order IDs for Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Order ID:</span> {order.orderId}
            </div>
            {order.shipping?.shiprocket_order_id && (
              <div>
                <span className="font-medium">Shiprocket Order ID:</span>{" "}
                {order.shipping.shiprocket_order_id}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{address?.name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {address?.contact}
                </div>
                {user?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="text-sm text-gray-700">
              <p>{address?.address_line_1}</p>
              {address?.address_line_2 && <p>{address?.address_line_2}</p>}
              <p>
                {address?.locality}, {address?.state}
              </p>
              <p>{address?.pincode}</p>
              {address?.landmark && (
                <p className="text-gray-600">Landmark: {address?.landmark}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking History */}
      {shippingInfo.shipping_history &&
        shippingInfo.shipping_history.length > 0 && (
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Tracking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shippingInfo.shipping_history.map((activity, index) => (
                  <div
                    key={index}
                    className="flex gap-3 pb-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm text-gray-900">
                          {activity.activity}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{activity.status}</p>
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Package Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Items</p>
              <p className="font-medium">{order.items.length} item(s)</p>
            </div>
            <div>
              <p className="text-gray-600">Total Weight</p>
              <p className="font-medium">
                {order.items
                  .reduce((weight, item) => {
                    const itemWeight =
                      item.appliedWeight || item.deadWeight || 0.5;
                    return weight + item.quantity * itemWeight;
                  }, 0)
                  .toFixed(2)}{" "}
                kg
              </p>
            </div>
            <div>
              <p className="text-gray-600">Declared Value</p>
              <p className="font-medium">
                ₹{order.total.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Payment Mode</p>
              <p className="font-medium">
                {order.paymentOption === "cash-on-delivery" ? "COD" : "Prepaid"}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Order Items</h4>
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex-grow">
                  <p className="font-medium">{item.productName}</p>
                  {item.selectedSize &&
                    typeof item.selectedSize === "object" &&
                    "label" in item.selectedSize && (
                      <p className="text-gray-600">
                        Size: {item.selectedSize.label}
                      </p>
                    )}
                </div>
                <div className="text-right">
                  <p>Qty: {item.quantity}</p>
                  <p className="text-gray-600">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedShippingInfo;
