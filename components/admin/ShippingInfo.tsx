"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "date-fns";

interface ShippingInfoProps {
  order: {
    _id: string;
    orderId: string;
    status: string;
    shipping?: {
      shiprocket_order_id?: number;
      shiprocket_shipment_id?: number;
      awb_code?: string;
      courier_name?: string;
      tracking_url?: string;
      shipping_status?: string;
      eta?: Date | string;
      pickup_date?: Date | string;
      delivered_date?: Date | string;
      last_update?: Date | string;
      shipping_history?: Array<{
        status: string;
        activity: string;
        location: string;
        date: Date | string;
      }>;
    };
  };
  onRefresh?: (orderId: string) => Promise<void>;
}

export const ShippingInfo: React.FC<ShippingInfoProps> = ({
  order,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh(order._id);
    } catch (error) {
      console.error("Error refreshing shipping info:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
      case "pickup_scheduled":
      case "pickup_generated":
        return "bg-yellow-100 text-yellow-800";
      case "picked_up":
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "lost":
        return "bg-red-100 text-red-800";
      case "returned":
      case "rto_initiated":
      case "rto_delivered":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
      case "lost":
        return <AlertCircle className="h-4 w-4" />;
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />;
      case "in_transit":
      case "picked_up":
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // If no shipping data exists
  if (!order.shipping?.shiprocket_order_id) {
    return (
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No shipping information available.
            </p>
            {order.status === "ready to ship" && (
              <p className="text-sm text-amber-600">
                Shipping will be created automatically when the order is marked
                as &quot;Ready to Ship&quot;
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Current Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Current Status</h4>
              {order.shipping.last_update && (
                <span className="text-xs text-gray-500">
                  Updated:{" "}
                  {formatDate(
                    new Date(order.shipping.last_update),
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getStatusColor(
                  order.shipping.shipping_status || ""
                )} flex items-center gap-1`}
              >
                {getStatusIcon(order.shipping.shipping_status || "")}
                {order.shipping.shipping_status?.replace(/_/g, " ") ||
                  "Unknown"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Shipment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shiprocket Order ID:</span>
                  <span className="font-medium">
                    {order.shipping.shiprocket_order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipment ID:</span>
                  <span className="font-medium">
                    {order.shipping.shiprocket_shipment_id}
                  </span>
                </div>
                {order.shipping.awb_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AWB Number:</span>
                    <span className="font-medium font-mono">
                      {order.shipping.awb_code}
                    </span>
                  </div>
                )}
                {order.shipping.courier_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Courier:</span>
                    <span className="font-medium">
                      {order.shipping.courier_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Timeline</h4>
              <div className="space-y-2 text-sm">
                {order.shipping.pickup_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup Date:</span>
                    <span className="font-medium">
                      {formatDate(
                        new Date(order.shipping.pickup_date),
                        "MMM dd, yyyy"
                      )}
                    </span>
                  </div>
                )}
                {order.shipping.eta && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className="font-medium">
                      {formatDate(new Date(order.shipping.eta), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {order.shipping.delivered_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivered:</span>
                    <span className="font-medium text-green-600">
                      {formatDate(
                        new Date(order.shipping.delivered_date),
                        "MMM dd, yyyy"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Link */}
          {order.shipping.awb_code && (
            <>
              <Separator />
              <div className="text-center">
                <Button
                  variant="outline"
                  asChild
                  className="inline-flex items-center gap-2"
                >
                  <a
                    href={`https://shiprocket.co/tracking/${order.shipping.awb_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Track Package on Shiprocket
                  </a>
                </Button>
              </div>
            </>
          )}

          {/* Shipping History */}
          {order.shipping.shipping_history &&
            order.shipping.shipping_history.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Tracking History
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {order.shipping.shipping_history
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((event, index) => (
                        <div
                          key={index}
                          className="flex gap-3 border-l-2 border-gray-200 pl-4 pb-3"
                        >
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {event.activity}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {event.location}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(
                                  new Date(event.date),
                                  "MMM dd, HH:mm"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
