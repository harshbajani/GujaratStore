import AuthForm from "@/components/AuthForm";

const ReferralSignUp = async ({
  params,
}: {
  params: Promise<{ referralCode: string }>;
}) => {
  const { referralCode } = await params;
  return <AuthForm type="sign-up" referralCode={referralCode} />;
};

export default ReferralSignUp;
