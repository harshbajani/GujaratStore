"use client";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) router.push("/");
  return <AuthForm type="sign-up" />;
};

export default SignUp;
