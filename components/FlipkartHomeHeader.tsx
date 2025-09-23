/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LogOut, Menu, Search, ShoppingCart } from "lucide-react";
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
import { UserNavLinks } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import SearchDropdown from "./SearchDropdown";
import { useCart } from "@/context/CartContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import HoverNavigationMenu from "./HoverNavigationMenu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ParentCategories } from "@/constants";

// Define the search result type
type SearchResult = {
  _id: string;
  productName: string;
  productCoverImage: string;
  parentCategory: {
    name: string;
  };
};

const FlipkartHomeHeader = () => {
  const [isOpen, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // * hooks
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoading } = useAuth({ redirectIfAuthenticated: false });
  const { data: session, status } = useSession();
  const { cartCount } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const cartItemsCount = cartCount || 0;
  const isAuthenticated = status === "authenticated";

  // Navigation data for mobile waterfall menu
  interface NavigationCategory {
    _id: string;
    name: string;
    primaryCategories: { _id: string; name: string }[];
  }
  const [navigationData, setNavigationData] = useState<NavigationCategory[]>(
    []
  );

  useEffect(() => {
    const fetchNav = async () => {
      try {
        const response = await fetch("/api/navigation/parent-categories");
        const data = await response.json();
        if (data.success) {
          // Enforce ParentCategories order
          const normalize = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]/g, "");
          const order = ParentCategories.map((c) => normalize(c.label));
          const sorted = [...data.data].sort((a: any, b: any) => {
            const ai = order.indexOf(normalize(a.name));
            const bi = order.indexOf(normalize(b.name));
            const aval = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
            const bval = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
            return aval - bval;
          });
          setNavigationData(sorted);
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchNav();
  }, []);

  // * Search function with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    // Set a new timeout (300ms debounce)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data);
        } else {
          console.error("Search error:", data.error);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Add cleanup effect for search timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Function to handle product selection and clear input
  const handleProductSelect = () => {
    setSearchQuery("");
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        isOpen &&
        sheetContentRef.current &&
        !sheetContentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, sheetContentRef, searchRef]);

  // * signOut function
  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      const response = await serverSignOut();
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

  // Add loading state UI
  const renderAuthButtons = () => {
    if (!isAuthenticated) {
      return (
        <div className="space-x-4">
          <Button
            variant="ghost"
            className="border border-white text-white rounded hover:bg-white/20 hover:text-white"
            asChild
          >
            <Link prefetch href="/sign-in">
              Login
            </Link>
          </Button>
          <Button
            variant="secondary"
            className="bg-white text-brand hover:bg-white/90"
            asChild
          >
            <Link prefetch href="/sign-up">
              Sign Up
            </Link>
          </Button>
        </div>
      );
    }
  };

  return (
    <nav className="w-full z-50">
      <div className="bg-brand">
        {/* Desktop Header */}
        <div className="h-20 w-full max-w-6xl mx-auto hidden md:flex flex-row items-center justify-between px-4">
          <div className="flex flex-row items-center space-x-4">
            <Link prefetch href="/">
              <Image src="/logo.png" height={56} width={108} alt="logo" />
            </Link>
            <div className="relative" ref={searchRef}>
              <Input
                className="w-[400px] bg-white"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setShowDropdown(true);
                  }
                }}
              />
              <Button className="absolute right-0 top-0 h-full bg-transparent hover:bg-transparent">
                <Search className="h-5 w-5 text-gray-500" />
              </Button>

              {showDropdown && (
                <SearchDropdown
                  results={searchResults}
                  isLoading={isSearching}
                  searchQuery={searchQuery}
                  onClose={handleProductSelect}
                />
              )}
            </div>
            {renderAuthButtons()}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              className="bg-transparent hover:bg-white/20 text-white"
              asChild
            >
              <Link
                prefetch
                href="/cart"
                className="flex items-center space-x-2"
              >
                <ShoppingCart />
                <span>
                  <div className="relative">
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-4 bg-white text-brand rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                        {cartItemsCount}
                      </span>
                    )}
                    Cart
                  </div>
                </span>
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
                      <Avatar className="border border-brand">
                        <AvatarFallback className="bg-white text-brand text-lg">
                          {session?.user?.name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">
                    {UserNavLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.route}
                        onClick={() => router.push(link.route)}
                        className="cursor-pointer flex items-center space-x-2"
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="ml-0.5"
                    >
                      <LogOut />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="h-[72px] w-full md:hidden flex items-center justify-between px-4">
          <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="primary" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              ref={sheetContentRef}
              side="left"
              className="w-[300px] sm:w-[400px] p-0"
            >
              <SheetHeader className="p-4 bg-brand text-white">
                <SheetTitle className="flex justify-between items-center">
                  <Link prefetch href="/">
                    <Image src="/logo.png" height={40} width={80} alt="logo" />
                  </Link>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Search */}
              <div className="p-4">
                <div className="relative" ref={searchRef}>
                  <Input
                    className="w-full bg-white"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                  />
                  <Button className="absolute right-0 top-0 h-full bg-transparent hover:bg-transparent">
                    <Search className="h-5 w-5 text-gray-500" />
                  </Button>

                  {showDropdown && (
                    <SearchDropdown
                      results={searchResults}
                      isLoading={isSearching}
                      searchQuery={searchQuery}
                      onClose={() => {
                        handleProductSelect();
                        setOpen(false);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Waterfall mobile nav inside sheet */}
              <div className="border-t px-4 py-3">
                <p className="text-sm text-gray-500 mb-3">Browse Categories</p>
                <Accordion type="single" collapsible className="w-full">
                  {navigationData.map((parent) => (
                    <AccordionItem key={parent._id} value={parent._id}>
                      <AccordionTrigger className="text-left capitalize">
                        {parent.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2">
                          {parent.primaryCategories?.map((pc) => (
                            <Link
                              prefetch
                              key={pc._id}
                              href={`/product-category/${pc._id}`}
                              className="text-sm text-gray-700 hover:text-brand"
                              onClick={() => setOpen(false)}
                            >
                              {pc.name}
                            </Link>
                          ))}
                          <Link
                            prefetch
                            href={`/category/${parent._id}`}
                            className="text-sm text-brand hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            View all {parent.name.toLowerCase()} →
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="px-4 py-3">{renderAuthButtons()}</div>
            </SheetContent>
          </Sheet>
          <Link href="/">
            <Image src="/logo.png" alt="logo" height={110} width={110} />
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              className="bg-transparent hover:bg-white/20 text-white relative"
              asChild
            >
              <Link
                prefetch
                href="/cart"
                className="flex items-center space-x-2"
              >
                <div className="relative">
                  <ShoppingCart />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-3 -right-4 bg-white text-brand rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
              </Link>
            </Button>

            {!isLoading && isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-white/20"
                  >
                    <Avatar className="border border-brand">
                      <AvatarFallback className="bg-white text-brand">
                        {session?.user?.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {UserNavLinks.map((link) => (
                    <DropdownMenuItem key={link.route} asChild>
                      <Link
                        prefetch
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

      {/* Navigation Menu - Home Page Style with Icons (desktop only) */}
      <div className="hidden md:block">
        <HoverNavigationMenu isHomePage={true} />
      </div>
    </nav>
  );
};

export default FlipkartHomeHeader;
