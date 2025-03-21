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
import { NavLinks, UserNavLinks } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { signOut as serverSignOut } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import SearchDropdown from "./SearchDropdown";
import { useCart } from "@/hooks/useCart";
import { Avatar, AvatarFallback } from "./ui/avatar";

// Define the search result type
type SearchResult = {
  _id: string;
  productName: string;
  productCoverImage: string;
  parentCategory: {
    name: string;
  };
};

const Header = () => {
  const [isOpen, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // * hooks
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoading } = useAuth(false);
  const { data: session, status } = useSession();
  const { cartItems } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const cartItemsCount = cartItems?.length || 0;
  const isAuthenticated = status === "authenticated";

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
      );
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
              <Link href="/cart" className="flex items-center space-x-2">
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
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            {/* Mobile Header - Sheet Content */}
            <SheetContent
              ref={sheetContentRef}
              side="left"
              className="w-[300px] sm:w-[400px] p-0"
            >
              <SheetHeader className="p-4 bg-brand text-white">
                <SheetTitle className="flex justify-between items-center">
                  <Link href="/">
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

              <div>
                <div className="border-t">
                  {NavLinks.map((link) => (
                    <Link
                      key={link.route}
                      href={link.route}
                      className="block px-4 py-3 text-gray-600 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3">{renderAuthButtons()}</div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-4">
            <Button
              className="bg-transparent hover:bg-white/20 text-white relative"
              asChild
            >
              <Link href="/cart" className="flex items-center space-x-2">
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
