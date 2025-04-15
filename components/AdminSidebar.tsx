import { cn } from "../lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { adminSidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  return (
    <Sidebar className="border-r bg-brand">
      <SidebarHeader className="h-24 flex items-center justify-center border-b border-white/20 bg-brand">
        <Link
          href="/vendor/dashboard"
          className="w-full h-full flex items-center justify-center"
        >
          <Image
            src="/logo.png"
            alt="logo"
            width={180}
            height={48}
            className="object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4 bg-brand">
        <SidebarGroup>
          {adminSidebarLinks.map(({ label, route, icon: Icon }) => (
            <div key={label}>
              {Array.isArray(route) ? (
                <div>
                  {/* Parent Menu */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer",
                      "hover:bg-white/10",
                      expandedMenu === label
                        ? "bg-white text-brand font-medium"
                        : "text-white"
                    )}
                    onClick={() => toggleSubMenu(label)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-6 h-6 mr-4" />
                      <span className="text-base">{label}</span>
                    </div>
                    {expandedMenu === label ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>

                  {/* Submenu with Sliding Effect */}
                  <div
                    className={cn(
                      "overflow-hidden transition-[max-height] duration-500 ease-in-out",
                      expandedMenu === label ? "max-h-[100vh]" : "max-h-0"
                    )}
                  >
                    <div className="ml-8">
                      {route.map(({ route: subRoute, label: subLabel }) => (
                        <Link key={subRoute} href={subRoute}>
                          <div
                            className={cn(
                              "flex items-center px-4 py-2 rounded-lg mb-2 transition-all duration-200",
                              "hover:bg-white/10",
                              pathname === subRoute
                                ? "bg-white text-brand font-medium"
                                : "text-white"
                            )}
                          >
                            <span className="text-sm">{subLabel}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link href={route}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200",
                      "hover:bg-white/10",
                      pathname === route
                        ? "bg-white text-brand font-medium"
                        : "text-white"
                    )}
                  >
                    <Icon className="w-6 h-6 mr-4" />
                    <span className="text-base">{label}</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
