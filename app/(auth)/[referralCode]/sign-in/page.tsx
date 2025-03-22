import AuthForm from "@/components/AuthForm";

const ReferralSignIn = async ({
  params,
}: {
  params: Promise<{ referralCode: string }>;
}) => {
  const { referralCode } = await params;
  return <AuthForm type="sign-in" referralCode={referralCode} />;
};

export default ReferralSignIn;
