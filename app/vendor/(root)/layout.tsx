"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { User2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/vendorAuth.actions";
import { useVendorDetails } from "@/hooks/useVendorDetails";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useVendorDetails();

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      const response = await serverSignOut();
      if (response.success) {
        toast({ title: "Success", description: "Signed out successfully" });
        router.push("/vendor/sign-in");
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
    <html lang="en">
      <body>
        <SessionProvider>
          <SidebarProvider>
            <div className="flex w-full">
              <AppSidebar />
              <main className=" flex-1 min-h-screen bg-neutral-100">
                <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                  <div className="flex items-center justify-between h-24 px-8">
                    <div className="flex flex-col justify-center">
                      <h1 className="text-2xl font-semibold font-playfair">
                        Welcome {user?.name}🙋‍♂️
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
                          <Link
                            prefetch
                            href="/vendor/account"
                            className="flex items-center"
                          >
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
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
