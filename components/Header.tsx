"use client";
import Image from "next/image";
import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LogOut, Menu, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks, UserNavLinks } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";

const Header = () => {
  const { isAuthenticated, isLoading } = useAuth(false);
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

  return (
    <nav className="fixed top-0 w-full z-50">
      <div className="bg-brand">
        {/* Desktop Header */}
        <div className="h-[72px] w-full max-w-6xl mx-auto hidden md:flex flex-row items-center justify-between px-4">
          <div className="flex flex-row items-center space-x-4">
            <Link href="/">
              <Image src="/logo.png" height={56} width={108} alt="logo" />
            </Link>
            <div className="relative">
              <Input className="w-[400px] bg-white" placeholder="Search..." />
              <Button className="absolute right-0 top-0 h-full bg-transparent hover:bg-transparent">
                <Search className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
            {!isLoading && !isAuthenticated && (
              <div className="space-x-4">
                <Button
                  variant="ghost"
                  className="border border-white text-white rounded hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link href="/sign-in">Login</Link>
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white text-brand hover:bg-white/90"
                  asChild
                >
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              className="bg-transparent hover:bg-white/20 text-white"
              asChild
            >
              <Link href="/cart" className="flex items-center space-x-2">
                <ShoppingCart />
                <span>Cart</span>
              </Link>
            </Button>
            {!isLoading && isAuthenticated && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full hover:bg-white/20"
                    >
                      <User className="h-5 w-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">
                    {UserNavLinks.map((link) => (
                      <DropdownMenuItem key={link.route} asChild>
                        <Link
                          href={link.route}
                          className="flex items-center space-x-2"
                        >
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="bg-white text-brand hover:bg-white hover:text-brand-200"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="h-[72px] w-full md:hidden flex items-center justify-between px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <SheetHeader className="p-4 bg-brand text-white">
                <SheetTitle className="flex justify-between items-center">
                  <Image src="/logo.png" height={40} width={80} alt="logo" />
                </SheetTitle>
              </SheetHeader>
              <div>
                <div className="border-t">
                  {NavLinks.map((link) => (
                    <Link
                      key={link.route}
                      href={link.route}
                      className="block px-4 py-3 text-gray-600 hover:bg-gray-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              {!isLoading && !isAuthenticated ? (
                <div className="px-4 py-3 flex space-x-2">
                  <Button
                    variant="ghost"
                    className="flex-1 border border-brand text-brand hover:bg-brand hover:text-white"
                    asChild
                  >
                    <Link href="/sign-in">Login</Link>
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-brand hover:bg-brand-300 text-white"
                    asChild
                  >
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <Button
                    className="w-full bg-brand text-white hover:bg-brand-300"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-4">
            <Button
              className="bg-transparent hover:bg-white/20 text-white"
              asChild
            >
              <Link href="/cart" className="flex items-center space-x-2">
                <ShoppingCart />
              </Link>
            </Button>

            {!isLoading && isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-white/20"
                  >
                    <User className="h-5 w-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {UserNavLinks.map((link) => (
                    <DropdownMenuItem key={link.route} asChild>
                      <Link
                        href={link.route}
                        className="flex items-center space-x-2"
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={handleSignOut} className="ml-0.5">
                    <LogOut />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links - Desktop Only */}
      <div className="bg-white drop-shadow-md h-9 hidden md:block">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between px-4">
            {NavLinks.map((link) => (
              <Link
                key={link.route}
                href={link.route}
                className="py-2 px-4 text-neutral-600 hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
