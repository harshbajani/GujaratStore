"use client";

import { withVendorProtection } from "../../HOC";
import Storeform from "@/lib/forms/storeform";
import VendorProfileForm from "@/lib/forms/vendorProfileForm";
import BankDetailsForm from "@/lib/forms/bankDetailsForm";

const AccountSettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
