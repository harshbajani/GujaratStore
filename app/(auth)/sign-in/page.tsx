"use client";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";

const SignIn = () => {
  const { isAuthenticated } = useAuth({
    requireAuth: true,
    protectedRoutes: ["/checkout"],
  });

  if (isAuthenticated) redirect("/");
  <AuthForm type="sign-in" />;
};

export default SignIn;
