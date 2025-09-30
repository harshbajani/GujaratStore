import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import {
  formatPaymentAmount,
  formatPaymentDate,
  getPaymentStatusBadge,
  formatPaymentMethod,
  getPaymentMethodIcon,
  formatPaymentReference,
  calculatePaymentProcessingTime,
  maskPaymentId,
} from "@/lib/utils/paymentUtils";
import { toast } from "sonner";

interface PaymentInfoRowProps {
  order: IOrder;
  showPaymentId?: boolean;
  showProcessingTime?: boolean;
}

interface PaymentInfoCardProps {
  order: IOrder;
  showAdvancedDetails?: boolean;
}

/**
 * Compact payment information row for table displays
 */
export const PaymentInfoRow: React.FC<PaymentInfoRowProps> = ({
  order,
  showPaymentId = false,
  showProcessingTime = false,
}) => {
  const statusBadge = getPaymentStatusBadge(
    order.paymentStatus,
    order.refundInfo
  );
  const paymentMethod = formatPaymentMethod(order.paymentOption);
  // Always use order.total for display as it's the definitive amount
  // payment_amount from Razorpay is in paise and may be inconsistent
  const paymentAmount = formatPaymentAmount(order.total);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {getPaymentMethodIcon(order.paymentOption)}
        </span>
        <span className="text-sm font-medium">{paymentMethod}</span>
        <Badge variant={statusBadge.variant} className={statusBadge.className}>
          {statusBadge.label}
        </Badge>
      </div>

      <div className="text-sm text-gray-600">
        <span className="font-medium">{paymentAmount}</span>
        {showPaymentId && order.paymentInfo?.razorpay_payment_id && (
          <span className="ml-2 text-xs">
            ID: {maskPaymentId(order.paymentInfo.razorpay_payment_id)}
          </span>
        )}
      </div>

      {showProcessingTime && order.paymentInfo?.verified_at && (
        <div className="text-xs text-gray-500">
          Processed in{" "}
          {calculatePaymentProcessingTime(
            order.createdAt,
            order.paymentInfo.verified_at
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Comprehensive payment information card for detail views
 */
export const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({
  order,
  showAdvancedDetails = false,
}) => {
  const statusBadge = getPaymentStatusBadge(
    order.paymentStatus,
    order.refundInfo
  );
  const paymentMethod = formatPaymentMethod(order.paymentOption);
  const paymentReference = formatPaymentReference(
    order.paymentInfo?.razorpay_payment_id,
    order.paymentInfo?.razorpay_order_id,
    order.orderId
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Payment Information
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-4 h-full">
        {/* Payment Status and Method */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Status</p>
            <Badge
              variant={statusBadge.variant}
              className={statusBadge.className}
            >
              {statusBadge.label}
            </Badge>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm font-medium text-gray-600">Method</p>
            <div className="flex items-center gap-1">
              <span>{getPaymentMethodIcon(order.paymentOption)}</span>
              <span className="text-sm font-medium">{paymentMethod}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Amount and Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              Amount
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatPaymentAmount(order.total)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Hash className="h-4 w-4" />
              Reference
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{paymentReference}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(paymentReference, "Reference")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Dates */}
        {(order.createdAt || order.paymentInfo?.verified_at) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.createdAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Order Date
                  </p>
                  <p className="text-sm">
                    {formatPaymentDate(order.createdAt)}
                  </p>
                </div>
              )}

              {order.paymentInfo?.verified_at && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Payment Date
                  </p>
                  <p className="text-sm">
                    {formatPaymentDate(order.paymentInfo.verified_at)}
                  </p>
                  {order.createdAt && (
                    <p className="text-xs text-gray-500">
                      Processed in{" "}
                      {calculatePaymentProcessingTime(
                        order.createdAt,
                        order.paymentInfo.verified_at
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Advanced Details */}
        {showAdvancedDetails && order.paymentInfo && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-800">
                Transaction Details
              </h4>

              {order.paymentInfo.razorpay_payment_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {maskPaymentId(order.paymentInfo.razorpay_payment_id)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          order.paymentInfo!.razorpay_payment_id!,
                          "Payment ID"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {order.paymentInfo.razorpay_order_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {maskPaymentId(order.paymentInfo.razorpay_order_id)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          order.paymentInfo!.razorpay_order_id!,
                          "Order ID"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {order.paymentInfo.payment_method && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-sm">
                    {formatPaymentMethod(order.paymentInfo.payment_method)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Refund Information */}
        {order.refundInfo && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                Refund Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.refundInfo.refund_status && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      Refund Status
                    </p>
                    <Badge
                      variant={
                        getPaymentStatusBadge(undefined, order.refundInfo)
                          .variant
                      }
                      className={
                        getPaymentStatusBadge(undefined, order.refundInfo)
                          .className
                      }
                    >
                      {getPaymentStatusBadge(undefined, order.refundInfo).label}
                    </Badge>
                  </div>
                )}

                {order.refundInfo.refund_amount && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      Refund Amount
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatPaymentAmount(order.total)}
                    </p>
                  </div>
                )}
              </div>

              {(order.refundInfo.refund_initiated_at ||
                order.refundInfo.refund_processed_at) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.refundInfo.refund_initiated_at && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Refund Initiated
                      </p>
                      <p className="text-sm">
                        {order.refundInfo.refund_initiated_at &&
                          formatPaymentDate(
                            typeof order.refundInfo.refund_initiated_at ===
                              "string"
                              ? order.refundInfo.refund_initiated_at
                              : order.refundInfo.refund_initiated_at.toISOString()
                          )}
                      </p>
                    </div>
                  )}

                  {order.refundInfo.refund_processed_at && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Refund Processed
                      </p>
                      <p className="text-sm">
                        {order.refundInfo.refund_processed_at &&
                          formatPaymentDate(
                            typeof order.refundInfo.refund_processed_at ===
                              "string"
                              ? order.refundInfo.refund_processed_at
                              : order.refundInfo.refund_processed_at.toISOString()
                          )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {order.refundInfo.refund_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Refund ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {maskPaymentId(order.refundInfo.refund_id)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          order.refundInfo!.refund_id!,
                          "Refund ID"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {order.refundInfo.refund_reason && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">
                    Refund Reason
                  </p>
                  <p className="text-sm text-gray-700 italic">
                    {order.refundInfo.refund_reason}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons for Failed Payments */}
        {order.paymentStatus === "failed" && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Payment summary for order listings
 */
export const PaymentSummary: React.FC<{ order: IOrder }> = ({ order }) => {
  const statusBadge = getPaymentStatusBadge(
    order.paymentStatus,
    order.refundInfo
  );

  return (
    <div className="flex items-center gap-2">
      {order.paymentStatus === "paid" ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : order.paymentStatus === "failed" ? (
        <XCircle className="h-4 w-4 text-red-600" />
      ) : (
        <Clock className="h-4 w-4 text-yellow-600" />
      )}

      <div>
        <Badge variant={statusBadge.variant} className={statusBadge.className}>
          {statusBadge.label}
        </Badge>
        <p className="text-xs text-gray-500 mt-1">
          {formatPaymentMethod(order.paymentOption)}
        </p>
      </div>
    </div>
  );
};

/**
 * Payment timeline component for tracking payment progress
 */
export const PaymentTimeline: React.FC<{ order: IOrder }> = ({ order }) => {
  const timeline = [
    {
      status: "Order Placed",
      timestamp: order.createdAt,
      completed: true,
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      status: "Payment Processing",
      timestamp: order.paymentInfo?.razorpay_order_id ? order.createdAt : null,
      completed: !!order.paymentInfo?.razorpay_order_id,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      status: "Payment Completed",
      timestamp: order.paymentInfo?.verified_at || null,
      completed: order.paymentStatus === "paid",
      icon:
        order.paymentStatus === "paid" ? (
          <CheckCircle className="h-4 w-4" />
        ) : order.paymentStatus === "failed" ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        ),
    },
  ];

  return (
    <div className="space-y-2">
      {timeline.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={`${item.completed ? "text-green-600" : "text-gray-400"}`}
          >
            {item.icon}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                item.completed ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {item.status}
            </p>
            {item.timestamp && (
              <p className="text-xs text-gray-500">
                {formatPaymentDate(item.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
