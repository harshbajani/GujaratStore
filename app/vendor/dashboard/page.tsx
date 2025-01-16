"use client";
import { Button } from "@/components/ui/button";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/vendorAuth.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { withVendorProtection } from "../HOC";

const DashboardPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      const response = await serverSignOut();
      if (response.success) {
        toast({ title: "Success", description: "Signed out successfully" });
        router.push("/");
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
  return (
    <div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-red-600 hover:bg-red-100"
        onClick={handleSignOut}
      >
        <span>LOG OUT</span>
      </Button>
    </div>
  );
};

export default withVendorProtection(DashboardPage);
