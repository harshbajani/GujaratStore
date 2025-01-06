import { useSession } from "next-auth/react";
import { usePathname, redirect } from "next/navigation";
import { useEffect } from "react";

export const useAuth = (requireAuth: boolean = true) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (requireAuth && !session) {
      redirect(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`); // * Redirect to sign-in page while saving the current path
    } else if (!requireAuth && session) {
      if (pathname === "/sign-in" || pathname === "/sign-up") {
        // * If we're on an auth page but user is already logged in, redirect to home
        redirect("/");
      }
    }
  }, [session, status, requireAuth, pathname]);

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
  };
};
