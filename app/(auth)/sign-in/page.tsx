"use client";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) router.push("/");
  return <AuthForm type="sign-in" />;
};

export default SignIn;
