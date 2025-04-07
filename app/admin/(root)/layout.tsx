"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { User2 } from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const AdminDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      // Call API endpoint to clear the cookie
      const response = await fetch("/api/admin/auth", {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Signed out",
          description: "You have been signed out of the admin dashboard",
          variant: "default",
        });

        // Redirect to login page
        router.push("/admin/login");
        router.refresh(); // Refresh to apply cookie changes
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <AdminSidebar />
        <main className="flex-1 min-h-screen bg-neutral-100">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between h-24 px-8">
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-semibold font-playfair">
                  Welcome Admin 🙋‍♂️
                </h1>
                <p className="text-sm text-muted-foreground font-playfair mt-1">
                  Here&apos;s what&apos;s happening in your store today.
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/50 hover:bg-accent no-border transition-colors duration-200">
                  <User2 className="w-6 h-6 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/account" className="flex items-center">
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="p-2 bg-neutral-100">{children}</div>
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardLayout;
