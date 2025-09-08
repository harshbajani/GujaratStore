"use client";

import { withVendorProtection } from "../../HOC";
import Storeform from "@/lib/forms/storeform";
import VendorProfileForm from "@/lib/forms/vendorProfileForm";
import BankDetailsForm from "@/lib/forms/bankDetailsForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

const AccountSettingsPage = () => {
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    emailVerified: boolean;
    hasStore: boolean;
    hasBankDetails: boolean;
  } | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch("/api/vendor/verification");
        const data = await response.json();

        if (data.success) {
          setVerificationStatus(data.data);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    checkVerificationStatus();
  }, []);

  // Check if everything is verified and complete
  const isFullyVerified =
    verificationStatus &&
    verificationStatus.emailVerified &&
    verificationStatus.isVerified &&
    verificationStatus.hasStore &&
    verificationStatus.hasBankDetails;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Verification Status */}
      {verificationStatus && (
        <>
          {isFullyVerified ? (
            // Show clean verified badge when everything is complete
            <div className="flex justify-center">
              <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Vendor Verified
                </span>
              </div>
            </div>
          ) : (
            // Show detailed status card when there are pending items
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <div className="flex items-center space-x-2">
                  {verificationStatus.isVerified ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  )}
                  <CardTitle className="text-xl font-playfair">
                    Verification Status
                  </CardTitle>
                </div>
                <CardDescription>
                  Current status of your vendor application
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email Verification</span>
                    <div className="flex items-center space-x-2">
                      {verificationStatus.emailVerified ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">
                            Not Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Business Approval</span>
                    <div className="flex items-center space-x-2">
                      {verificationStatus.isVerified ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Approved
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-600 font-medium">
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Store Information</span>
                    <div className="flex items-center space-x-2">
                      {verificationStatus.hasStore ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Complete
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">
                            Incomplete
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Bank Details</span>
                    <div className="flex items-center space-x-2">
                      {verificationStatus.hasBankDetails ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Complete
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">
                            Incomplete
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!verificationStatus.emailVerified && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please verify your email address to continue. Check your
                      inbox for the verification email.
                    </AlertDescription>
                  </Alert>
                )}

                {verificationStatus.emailVerified &&
                  !verificationStatus.isVerified && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your vendor application is under review. Please complete
                        all required information and wait for business approval
                        to access the vendor panel.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Profile Overview Card */}
      <VendorProfileForm />

      {/* Store Overview Card */}
      <Storeform />

      {/* Bank Details Card */}
      <BankDetailsForm />

      {/* Preferences Card */}
      {/* <Card className="border-none shadow-lg">
        <CardHeader className="bg-brand/5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-playfair">
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </div>
            <Bell className="w-6 h-6 text-brand" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Order Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Get notified when you receive a new order
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Product Updates</h4>
              <p className="text-sm text-muted-foreground">
                Get notified when products are running low
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default withVendorProtection(AccountSettingsPage);
