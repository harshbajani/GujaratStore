import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuth = (
  options: {
    requireAuth?: boolean;
    redirectIfAuthenticated?: boolean;
    protectedRoutes?: string[];
  } = {}
) => {
  const {
    requireAuth = false,
    redirectIfAuthenticated = false,
    protectedRoutes = [],
  } = options;

  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Authentication required for specific routes
    if ((requireAuth || isProtectedRoute) && !session) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect authenticated users from auth pages
    if (redirectIfAuthenticated && session) {
      if (["/sign-in", "/sign-up"].includes(pathname)) {
        router.push("/");
        return;
      }
    }
  }, [session, status, pathname, requireAuth, redirectIfAuthenticated]);

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
  };
};
