import { cn } from "../lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { vendorSidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className=" border-r bg-brand">
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
          {vendorSidebarLinks.map(({ label, route, icon: Icon }) => (
            <Link key={route} href={route}>
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
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
