"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ParentCategories } from "@/constants";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface NavigationCategory {
  _id: string;
  name: string;
  slug: string;
  route: string;
  primaryCategories: {
    _id: string;
    name: string;
    slug: string;
    parentCategory: {
      _id: string;
      name: string;
    };
  }[];
}

interface ParentCategoryWithIcon {
  _id: string;
  name: string;
  slug: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HoverNavigationMenuProps {
  isHomePage?: boolean;
}

const HoverNavigationMenu: React.FC<HoverNavigationMenuProps> = ({
  isHomePage = false,
}) => {
  const [navigationData, setNavigationData] = useState<NavigationCategory[]>(
    []
  );
  const [parentCategoriesWithIcons, setParentCategoriesWithIcons] = useState<
    ParentCategoryWithIcon[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [defaultHighlightCategory, setDefaultHighlightCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDropdownPosition = (categoryId: string) => {
    const trigger = triggerRefs.current[categoryId];
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + rect.width / 2 + window.scrollX, // center horizontally
      });
    }
  };

  const handleMouseEnter = (categoryId: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredCategory(categoryId);
    calculateDropdownPosition(categoryId);
  };

  const handleMouseLeave = () => {
    // Add delay before closing to allow mouse to move to dropdown
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setDropdownPosition(null);
    }, 100); // 100ms delay
  };

  const handleDropdownEnter = () => {
    // Clear timeout when mouse enters dropdown
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownLeave = () => {
    // Close dropdown when mouse leaves it
    setHoveredCategory(null);
    setDropdownPosition(null);
  };

  useEffect(() => {
    const fetchNavigationData = async () => {
      try {
        const response = await fetch("/api/navigation/parent-categories");
        const data = await response.json();

        if (data.success) {
          // Sort navigation data with Creative Corner at the end
          const normalizeNav = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]/g, "");
          const sortedNavigationData = [...data.data].sort((a, b) => {
            const aName = normalizeNav(a.name);
            const bName = normalizeNav(b.name);

            // Creative Corner always goes to the end
            const isACreative = aName.includes("creative");
            const isBCreative = bName.includes("creative");

            if (isACreative && !isBCreative) return 1;
            if (!isACreative && isBCreative) return -1;

            // For others, maintain original order or alphabetical
            return a.name.localeCompare(b.name);
          });

          setNavigationData(sortedNavigationData);

          // Set Creative Corner as default highlighted (visual only, no dropdown)
          const creativeCornerNav = sortedNavigationData.find(cat => 
            normalizeNav(cat.name).includes('creative')
          );
          if (creativeCornerNav) {
            setDefaultHighlightCategory(creativeCornerNav._id);
          }

          // Map database parent categories with icons from constants
          const mappedCategories = data.data.map(
            (dbCategory: NavigationCategory) => {
              // Try multiple matching strategies
              const constantCategory = ParentCategories.find((cat) => {
                const catLabel = cat.label.toLowerCase().trim();
                const dbName = dbCategory.name.toLowerCase().trim();

                // Direct match
                if (catLabel === dbName) return true;

                // Remove special characters and spaces
                const catNormalized = catLabel.replace(/[^a-z0-9]/g, "");
                const dbNormalized = dbName.replace(/[^a-z0-9]/g, "");
                if (catNormalized === dbNormalized) return true;

                // Check if one contains the other
                if (catLabel.includes(dbName) || dbName.includes(catLabel))
                  return true;

                // Special mappings
                if (
                  (catLabel === "toys & games" &&
                    dbName === "toys and games") ||
                  (catLabel === "food & beverages" &&
                    dbName === "food and beverages") ||
                  (catLabel === "home decor" && dbName === "home decor") ||
                  (catLabel === "creative corner" &&
                    dbName === "creative corner")
                )
                  return true;

                return false;
              });

              // Determine a robust fallback icon based on the DB category name
              const getFallbackIcon = () => {
                const dn = dbCategory.name.toLowerCase();
                const by = (needle: string) =>
                  ParentCategories.find((c) =>
                    c.label.toLowerCase().includes(needle)
                  )?.icon;

                if (dn.includes("toy") || dn.includes("game")) {
                  return by("toys") || ParentCategories[0].icon;
                }
                if (
                  dn.includes("food") ||
                  dn.includes("beverage") ||
                  dn.includes("bevrage")
                ) {
                  return by("food") || ParentCategories[0].icon;
                }
                if (dn.includes("home") && dn.includes("decor")) {
                  return by("home") || ParentCategories[0].icon;
                }
                if (dn.includes("fashion")) {
                  return by("fashion") || ParentCategories[0].icon;
                }
                if (dn.includes("handicraft")) {
                  return by("handicraft") || ParentCategories[0].icon;
                }
                if (dn.includes("organic")) {
                  return by("organic") || ParentCategories[0].icon;
                }
                if (dn.includes("creative")) {
                  return by("creative") || ParentCategories[0].icon;
                }
                return ParentCategories[0].icon;
              };

              return {
                _id: dbCategory._id,
                name: dbCategory.name,
                slug: dbCategory.slug,
                route: `/category/${dbCategory.slug}`,
                icon: constantCategory?.icon || getFallbackIcon(),
              };
            }
          );

          // Enforce desired order with Creative Corner at the end
          const normalizeHome = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]/g, "");
          const order = ParentCategories.map((c) => normalizeHome(c.label));

          const sortedCategories = [...mappedCategories].sort((a, b) => {
            const aName = normalizeHome(a.name);
            const bName = normalizeHome(b.name);

            // Creative Corner always goes to the end
            const isACreative = aName.includes("creative");
            const isBCreative = bName.includes("creative");

            if (isACreative && !isBCreative) return 1;
            if (!isACreative && isBCreative) return -1;

            // For non-creative items, use original order
            const ai = order.indexOf(aName);
            const bi = order.indexOf(bName);
            const aval = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
            const bval = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
            return aval - bval;
          });

          setParentCategoriesWithIcons(sortedCategories);

          // Set Creative Corner as default highlighted (visual only, no dropdown)
          const creativeCornerHome = sortedCategories.find(cat => 
            normalizeHome(cat.name).includes('creative')
          );
          if (creativeCornerHome) {
            setDefaultHighlightCategory(creativeCornerHome._id);
          }
        } else {
          console.error("Failed to fetch navigation data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching navigation data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigationData();
  }, []);

  if (loading) {
    return <HoverNavigationMenuSkeleton />;
  }

  return (
    <>
      <div
        className={cn(
          "bg-white drop-shadow-md relative z-50 overflow-visible",
          isHomePage ? "h-16 md:h-20" : "h-14"
        )}
      >
        <div className="max-w-full mx-auto overflow-visible">
          <div
            className={cn(
              "flex items-center px-2 md:px-4 overflow-hidden",
              isHomePage
                ? "justify-start md:justify-center space-x-3 md:space-x-6 lg:space-x-14 h-16 md:h-20"
                : "justify-center h-14 space-x-6 md:space-x-8 w-full"
            )}
          >
            {isHomePage
              ? // Home page - show icons with parent categories from database
                parentCategoriesWithIcons.map((parentCategory) => {
                  return (
                    <div
                      key={parentCategory._id}
                      className="relative"
                      ref={(el) => {
                        triggerRefs.current[parentCategory._id] = el;
                      }}
                      onMouseEnter={() => handleMouseEnter(parentCategory._id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link href={`/category/${parentCategory.slug}`}>
                        <div
                          className={cn(
                            "flex flex-col items-center space-y-1 p-2 md:p-3 rounded-lg transition-all duration-200 min-w-max cursor-pointer",
                            "hover:bg-brand hover:text-white",
                            hoveredCategory === parentCategory._id
                              ? "bg-brand text-white"
                              : defaultHighlightCategory === parentCategory._id
                              ? "bg-brand text-white"
                              : "text-brand bg-transparent",
                            "text-xs md:text-sm"
                          )}
                        >
                          <parentCategory.icon className="h-5 w-5 md:h-8 md:w-8" />
                          <span className="text-xs font-medium whitespace-nowrap capitalize">
                            {parentCategory.name}
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })
              : // Other pages - show text-only parent categories
                navigationData.map((navigationCategory) => (
                  <div
                    key={navigationCategory._id}
                    className="relative"
                    ref={(el) => {
                      triggerRefs.current[navigationCategory._id] = el;
                    }}
                    onMouseEnter={() =>
                      handleMouseEnter(navigationCategory._id)
                    }
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link href={`/category/${navigationCategory.slug}`}>
                      <div
                        className={cn(
                          "flex items-center justify-center gap-2 transition-colors text-sm font-medium px-3 py-2 cursor-pointer capitalize rounded-md",
                        hoveredCategory === navigationCategory._id
                          ? "text-brand bg-brand/10 border border-brand/20"
                          : defaultHighlightCategory === navigationCategory._id
                          ? "text-brand bg-brand/10 border border-brand/20"
                          : "text-neutral-600 hover:text-brand hover:bg-brand/5"
                        )}
                      >
                        {navigationCategory.name}
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Dropdown Portal */}
      {hoveredCategory &&
        dropdownPosition &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[400px]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              transform: "translateX(-50%)", // center horizontally
            }}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            {(() => {
              // Find the current hovered category data
              const currentParentCategory = isHomePage
                ? parentCategoriesWithIcons.find(
                    (cat) => cat._id === hoveredCategory
                  )
                : null;
              const currentNavigationCategory = navigationData.find(
                (nav) => nav._id === hoveredCategory
              );

              if (
                !currentNavigationCategory ||
                currentNavigationCategory.primaryCategories.length === 0
              ) {
                return null;
              }

              return (
                <div className="p-4">
                  <div className="grid gap-3">
                    {isHomePage && currentParentCategory && (
                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20">
                        <currentParentCategory.icon className="h-5 w-5 text-brand" />
                        <span className="font-semibold text-brand text-sm capitalize">
                          {currentParentCategory.name}
                        </span>
                      </div>
                    )}

                    {!isHomePage && (
                      <div className="font-semibold text-brand text-sm border-b border-gray-100 pb-2 capitalize">
                        {currentNavigationCategory.name}
                      </div>
                    )}

                    <div
                      className={
                        isHomePage
                          ? "grid grid-cols-2 gap-2"
                          : "grid grid-cols-1 gap-1"
                      }
                    >
                      {currentNavigationCategory.primaryCategories
                        .slice(0, isHomePage ? 8 : 20)
                        .map((primaryCategory) => (
                          <Link
                            key={primaryCategory._id}
                            href={`/product-category/${primaryCategory.slug}`}
                            className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors group"
                          >
                            <div className="text-sm text-gray-700 group-hover:text-brand font-medium">
                              {primaryCategory.name}
                            </div>
                          </Link>
                        ))}
                    </div>

                    {currentNavigationCategory.primaryCategories.length >
                      (isHomePage ? 8 : 20) &&
                      currentParentCategory && (
                        <Link
                          href={`/category/${currentParentCategory.slug}`}
                          className="text-brand hover:underline text-sm font-medium text-center p-2 border-t border-gray-100 mt-2"
                        >
                          View all {currentParentCategory.name.toLowerCase()} →
                        </Link>
                      )}
                  </div>
                </div>
              );
            })()}
          </div>,
          document.body
        )}
    </>
  );
};

export default HoverNavigationMenu;

const HoverNavigationMenuSkeleton = ({
  isHomePage,
}: HoverNavigationMenuProps) => {
  return (
    <div
      className={cn(
        "bg-white drop-shadow-md relative z-50 overflow-visible",
        isHomePage ? "h-16 md:h-20" : "h-14"
      )}
    >
      <div className="max-w-6xl mx-auto overflow-visible">
        <div
          className={cn(
            "flex items-center px-2 md:px-4 overflow-x-auto scrollbar-hide overflow-y-visible",
            isHomePage
              ? "justify-start md:justify-center space-x-3 md:space-x-6 lg:space-x-8 h-16 md:h-20"
              : "justify-center h-14 space-x-6 md:space-x-8 w-full"
          )}
        >
          {isHomePage
            ? // Home page skeleton - show icon and text placeholders
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-1 p-2 md:p-3 rounded-lg min-w-max"
                >
                  <div className="h-5 w-5 md:h-6 md:w-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))
            : // Other pages skeleton - show text placeholders
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-2 px-4 py-2"
                >
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};
