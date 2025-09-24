// app/order-summary/[orderId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { ShoppingBag, Truck, Clock, CheckCircle } from "lucide-react";
import Loader from "@/components/Loader";
import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";

interface OrderItem {
  productId: string;
  productName: string;
  coverImage: string;
  price: number;
  quantity: number;
  deliveryDate: string;
  selectedSize?: string;
}

interface Address {
  _id: string;
  name: string;
  contact: string;
  address_line_1: string;
  address_line_2: string;
  locality: string;
  state: string;
  pincode: string;
  type: string;
}

interface Order {
  _id: string;
  orderId: string;
  status: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  addressId: string;
  paymentOption: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  addresses: Address[];
}

const OrderSummaryPage = () => {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);

        // Fetch the order details
        const orderResponse = await fetch(`/api/order/${orderId}`);
        const orderData = await orderResponse.json();

        if (!orderData.success) {
          toast.error("Oops!", {
            description: "Failed to load order details",
            duration: 5000,
          });
          router.push("/");
          return;
        }

        setOrder(orderData.order);

        // Fetch user data to get address info
        const userResponse = await fetch("/api/user/current");
        const userData = await userResponse.json();

        if (userData.success) {
          setUser(userData.data);

          // Find the address used for this order
          const orderAddress = userData.data.addresses.find(
            (addr: Address) => addr._id === orderData.order.addressId
          );

          setAddress(orderAddress || null);
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
        toast.error("Error", {
          description: "Something went wrong",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loader />;
  if (!order) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5" />;
      case "processing":
        return <Clock className="h-5 w-5" />;
      case "delivered":
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt), "d MMM yyyy, h:mm a")
    : "";

  if (!isAuthenticated) router.push("/sign-in");

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* Show the print wrapper and everything inside it */
          .print-wrapper,
          .print-wrapper * {
            visibility: visible;
          }

          /* Hide specific elements we don't want in the printed receipt */
          .no-print {
            display: none !important;
          }

          /* Position the print content at the top of the page */
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }

          /* Remove shadows and backgrounds for better printing */
          .print-wrapper .shadow-sm {
            box-shadow: none !important;
          }

          .print-wrapper .bg-white {
            background-color: white !important;
            margin-bottom: 20px !important;
            border: 1px solid #e5e7eb !important;
          }

          /* Make sure text is black for printing */
          .print-wrapper {
            color: black !important;
          }

          /* Add a light border between sections */
          .print-section {
            border-bottom: 1px dashed #ccc;
            margin-bottom: 15px;
            padding-bottom: 15px;
          }

          /* Remove rounded corners for cleaner print */
          .print-wrapper .rounded-md {
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header - Not Printable */}
        <div className="no-print">
          <BreadcrumbHeader
            title="Home"
            subtitle="Order Summary"
            titleHref="/"
          />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Print Wrapper - Contains all sections to be printed */}
            <div className="print-wrapper">
              {/* Order Header */}
              <div className="bg-white rounded-md p-6 mb-4 shadow-sm print-section">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Order Summary</h1>
                    <p className="text-gray-600">Order ID: {order.orderId}</p>
                    <p className="text-gray-600">Placed on: {formattedDate}</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Action buttons - Not Printable */}
                <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t no-print">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1"
                  >
                    Continue Shopping
                  </Button>
                  <Button onClick={handlePrint} className="flex-1 primary-btn">
                    Print Order
                  </Button>
                </div>
              </div>

              {/* Delivery Address */}
              {address && (
                <div className="bg-white rounded-md p-6 mb-4 shadow-sm print-section">
                  <h2 className="text-lg font-semibold mb-4">
                    Delivery Address
                  </h2>
                  <div className="text-gray-700">
                    <p className="font-medium">{address.name}</p>
                    <p>{address.contact}</p>
                    <p>{address.address_line_1}</p>
                    <p>{address.address_line_2}</p>
                    <p>
                      {address.locality}, {address.state} - {address.pincode}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 rounded">
                      {address.type}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-md p-6 mb-4 shadow-sm print-section">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex border-b pb-4">
                      <div className="w-20 h-20 flex-shrink-0 mr-4">
                        <Image
                          src={`/api/files/${item.coverImage}`}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productName}</h3>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-600">
                            Size: {item.selectedSize}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          Delivery by: {item.deliveryDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-md p-6 mb-4 shadow-sm print-section">
                <h2 className="text-lg font-semibold mb-4">
                  Payment Information
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium">
                      {order.paymentOption === "cash-on-delivery"
                        ? "Cash on Delivery"
                        : order.paymentOption}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    {order.deliveryCharges > 0 ? (
                      <span>
                        ₹{order.deliveryCharges.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-green-500">Free</span>
                    )}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{order.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Tracking - Not Printable */}
            <div className="bg-white rounded-md p-6 mb-4 shadow-sm no-print">
              <h2 className="text-lg font-semibold mb-4">Order Status</h2>
              <div className="relative">
                <div className="flex items-center mb-8">
                  <div className="relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        [
                          "confirmed",
                          "processing",
                          "ready to ship",
                          "delivered",
                        ].includes(order.status.toLowerCase())
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="mt-2 text-sm font-medium">Confirmed</div>
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["processing", "ready to ship", "delivered"].includes(
                        order.status.toLowerCase()
                      )
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  ></div>
                  <div className="relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        ["processing", "ready to ship", "delivered"].includes(
                          order.status.toLowerCase()
                        )
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="mt-2 text-sm font-medium">Processing</div>
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["ready to ship", "delivered"].includes(
                        order.status.toLowerCase()
                      )
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  ></div>
                  <div className="relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        ["ready to ship", "delivered"].includes(
                          order.status.toLowerCase()
                        )
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      Ready to Ship
                    </div>
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["delivered"].includes(order.status.toLowerCase())
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  ></div>
                  <div className="relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        ["delivered"].includes(order.status.toLowerCase())
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div className="mt-2 text-sm font-medium">Delivered</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Help Section - Not Printable */}
            <div className="bg-white rounded-md p-6 shadow-sm no-print">
              <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/contact")}
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/returns")}
                >
                  Return Policy
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/faq")}
                >
                  FAQs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSummaryPage;
