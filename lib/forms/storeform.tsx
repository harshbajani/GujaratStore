import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVendorDetails } from "@/hooks/useVendorDetails";
import { Mail, Phone, Store, User2 } from "lucide-react";
import Link from "next/link";
import React from "react";

const Storeform = () => {
  const { user } = useVendorDetails();

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-brand/5 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-playfair">
              Store Settings
            </CardTitle>
            <CardDescription className="mt-2">
              Manage your store profile and preferences
            </CardDescription>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
            <Store className="w-6 h-6 text-brand" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Section */}
          <div className="space-y-4">
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
      <CardFooter className="flex items-end justify-end">
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/vendor/dashboard">Cancel</Link>
          </Button>
          <Button className="bg-brand hover:bg-brand/90">Save Changes</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Storeform;
