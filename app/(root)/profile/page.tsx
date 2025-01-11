"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/auth.actions";
import {
  Settings,
  ShoppingBag,
  MapPin,
  Ticket,
  Heart,
  Star,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Profile from "./components/Profile";
import Address from "./components/Address";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserDetails } from "@/hooks/useUserDetails";

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const userDetails = useUserDetails();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false }); // * First, call the client-side NextAuth signOut
      const response = await serverSignOut(); // * Then call your server action
      if (response.success) {
        toast({ title: "Success", description: "Signed out successfully" });
        router.push("/sign-in");
      } else {
        toast({
          title: "Failed",
          description: response.message || "Failed to sign out",
        });
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const sidebarItems = [
    {
      id: "profile",
      label: "PROFILE SETTINGS",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "orders",
      label: "MY ORDERS",
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    { id: "address", label: "ADDRESS", icon: <MapPin className="w-4 h-4" /> },
    { id: "coupons", label: "COUPON'S", icon: <Ticket className="w-4 h-4" /> },
    { id: "wishlist", label: "WISHLIST", icon: <Heart className="w-4 h-4" /> },
    {
      id: "reviews",
      label: "REVIEWS & RATINGS",
      icon: <Star className="w-4 h-4" />,
    },
    {
      id: "notifications",
      label: "NOTIFICATIONS",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <Profile />;
      case "address":
        return <Address />;
      default:
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
            <p>Content for {activeSection} section</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="flex flex-col">
          <div className="flex-center">
            <Card className="flex items-center gap-4 p-4 shadow-md w-full md:w-64 h-20">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-muted-foreground text-2xl">
                  {userDetails.user?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">Hello,</p>
                <h1 className="text-xl font-semibold">
                  {userDetails.user?.name}
                </h1>
              </div>
            </Card>
          </div>
          <div className="w-full md:w-64 mt-2 space-y-2 shadow-md p-2 rounded">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start items-center gap-2 hover:bg-red-100 ${
                  activeSection === item.id ? "bg-red-200 text-brand" : ""
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="text-brand ml-auto" />
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-red-600 hover:bg-red-100"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              <span>LOG OUT</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">{renderContent()}</Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
