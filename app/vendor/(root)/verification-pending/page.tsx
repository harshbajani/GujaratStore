"use client";

import { withVendorProtection } from "../../HOC";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const VerificationPendingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center bg-yellow-50 rounded-t-lg">
            <div className="flex justify-center mb-4">
              <Clock className="w-16 h-16 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-playfair text-yellow-800">
              Verification Pending
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Your vendor application is under review
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please wait until your application is verified to become a
                vendor. You will be notified once the verification process is
                complete.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                What happens next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Application Review
                    </p>
                    <p className="text-sm text-gray-600">
                      Our team is reviewing your vendor application and
                      documents.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Verification Process
                    </p>
                    <p className="text-sm text-gray-600">
                      We&apos;ll verify your business details and contact
                      information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Access Granted</p>
                    <p className="text-sm text-gray-600">
                      Once verified, you&apos;ll have full access to the vendor
                      panel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-4">
                Need to update your account information? You can still access
                your account settings.
              </p>
              <Button
                onClick={() => router.push("/vendor/account")}
                className="w-full"
                variant="outline"
              >
                Go to Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withVendorProtection(VerificationPendingPage);
