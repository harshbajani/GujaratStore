"use client";
import Loader from "@/components/Loader";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function withAuthProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (status === "loading") return;

      // Redirect authenticated users to the dashboard if they are accessing auth routes
      if (session) {
        if (
          session.user.role === "vendor" &&
          pathname.includes("/vendor/sign-in")
        ) {
          router.replace("/vendor/dashboard");
        }
      }
    }, [session, status, pathname, router]);

    if (status === "loading") {
      return (
        <div>
          <Loader />
        </div>
      ); // You can replace this with a loader component
    }

    return <WrappedComponent {...props} />;
  };
}
