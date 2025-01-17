"use client";
import React from "react";
import { User2, Mail, Store, Phone, Shield, Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useVendorDetails } from "@/hooks/useVendorDetails";
import { withVendorProtection } from "../../HOC";
import Link from "next/link";

const AccountSettingsPage = () => {
  const { user } = useVendorDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-8 ">
      {/* Profile Overview Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-brand/5 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-playfair">
                Account Settings
              </CardTitle>
              <CardDescription className="mt-2">
                Manage your store profile and preferences
              </CardDescription>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
                  <User2 className="w-8 h-8 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">Store Owner</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative mt-1">
                    <User2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      defaultValue={user?.name}
                      className="bg-muted/50 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      defaultValue={user?.email}
                      className="bg-muted/50 pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Store Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Store Name</label>
                <div className="relative mt-1">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    defaultValue="The Gujarat Store"
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="tel"
                    className="bg-muted/50 pl-10"
                    defaultValue={user?.phone}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card className="border-none shadow-lg">
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
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/vendor/dashboard">Cancel</Link>
        </Button>
        <Button className="bg-brand hover:bg-brand/90">Save Changes</Button>
      </div>
    </div>
  );
};

export default withVendorProtection(AccountSettingsPage);
