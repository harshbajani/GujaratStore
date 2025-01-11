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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Profile from "./components/Profile";
import Address from "./components/Address";

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState("profile");
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
        <div className="w-full md:w-64 space-y-2 shadow-md p-2 rounded">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start gap-2 hover:bg-red-100 ${
                activeSection === item.id ? "bg-red-200 text-brand" : ""
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
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

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">{renderContent()}</Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
