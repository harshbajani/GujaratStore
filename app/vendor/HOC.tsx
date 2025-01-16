"use client";
import Loader from "@/components/Loader";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withVendorProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "loading") return;

      if (!session) {
        router.replace("/vendor/sign-in");
      } else if (session.user.role !== "vendor") {
        router.replace("/vendor/unauthorized");
      }
    }, [session, status, router]);

    if (status === "loading") {
      return (
        <div>
          <Loader />
        </div>
      ); // Or your loading component
    }

    if (!session || session.user.role !== "vendor") {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
