import { FC } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: { [key: string]: string | undefined };
}

const ResetPasswordPage: FC<PageProps> = ({ searchParams }) => {
  const email = searchParams.email;
  const token = searchParams.token;

  if (!email || !token) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm email={email} token={token} />;
};

export default ResetPasswordPage;
