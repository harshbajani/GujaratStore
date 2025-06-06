/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import OtpModal from "@/components/OTPModal";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { resendOTP, signUp, verifyOTP } from "@/lib/actions/auth.actions";
import { authFormSchema, FormType } from "@/lib/validations";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle } from "react-icons/fa";
import GoogleAutoSignIn from "./GoogleAutoSignIn";

const AuthForm = ({
  type,
  referralCode: initialReferralCode,
}: {
  type: FormType;
  referralCode?: string;
}) => {
  // * useStates and hooks
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode || "");
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = authFormSchema(type);
  type FormValues = z.infer<typeof formSchema>;

  // Show toast notification about the referral if code is provided
  useEffect(() => {
    if (referralCode) {
      toast({
        title: "Referral Detected",
        description:
          "You're signing up with a referral link. You'll receive special discounts!",
      });
    }
  }, [referralCode, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      type === "sign-up"
        ? {
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          }
        : {
            email: "",
            password: "",
          },
  });

  // * user data submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (type === "sign-up") {
        const result = await signUp({
          name: values.name!,
          email: values.email,
          phone: values.phone!,
          password: values.password,
          role: "user",
          referral: referralCode || undefined, // Include referral code if present
        });

        if (result.success) {
          toast({
            title: "Success",
            description: referralCode
              ? "Signed up successfully with referral discount!"
              : "Signed up successfully",
          });
          setUserEmail(values.email);
          setShowOtpModal(true);
        } else {
          toast({
            title: "Failed",
            description: result.message || "Failed to sign up",
          });
          setErrorMessage(result.message);
        }
      } else {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          role: "user",
          redirect: false,
        });

        if (result?.error) {
          toast({
            title: "Failed",
            description: result.error || "Failed to sign in",
          });
          setErrorMessage(result.error);
        } else if (result?.ok) {
          toast({ title: "Success", description: "Signed In successfully" });
          router.push("/");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare the links for sign-in/sign-up with referral preservation
  const getAuthLink = (linkType: "sign-in" | "sign-up") => {
    if (referralCode) {
      return `/${referralCode}/${linkType}`;
    }
    return `/${linkType}`;
  };

  return (
    <div className="flex w-full flex-col">
      <GoogleAutoSignIn />
      {/* Header section with responsive height and padding */}
      <div className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[240px]">
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_00%_right_200px]" />
        <div className="absolute inset-0 bg-brand-200/30" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8 mt-14">
          <h1 className="h1 mb-2 text-2xl sm:text-3xl md:text-4xl">
            નમસ્તે જી
          </h1>
          <p className="subtitle-1 text-sm sm:text-base md:text-lg">
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </p>
          {referralCode && (
            <div className="mt-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Referral Discount Applied!
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 w-full bg-[url('/bg/bg2.png')] bg-cover bg-center bg-no-repeat md:bg-[top_50%_right_200px]">
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16 lg:py-12">
          <Card className="mx-auto w-full max-w-lg h-auto shadow-md">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="auth-form"
              >
                <CardHeader className="space-y-2 px-4 pt-6 sm:px-6 sm:pt-8">
                  <h1 className="form-title text-xl sm:text-2xl md:text-3xl">
                    {type === "sign-in" ? "Sign In" : "Sign Up"}
                  </h1>
                  <CardDescription className="text-center text-sm sm:text-base md:text-left">
                    {type === "sign-up"
                      ? "Create an account to get started"
                      : "Sign in to your account"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-4 sm:px-6">
                  {type === "sign-up" && (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your name"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your phone number"
                                {...field}
                                className="h-10 sm:h-11"
                                maxLength={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Confirm Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirm your password"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {referralCode && (
                        <div className="bg-green-50 border border-green-100 p-3 rounded-md mb-2">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-green-500 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <p className="text-sm text-green-700">
                              <span className="font-medium">
                                Referral Applied:
                              </span>{" "}
                              You&apos;ll receive special discounts on eligible
                              products!
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {type === "sign-in" && (
                    <>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm sm:text-base">
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                                className="h-10 sm:h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 px-4 pb-6 sm:px-6 sm:pb-8">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="form-submit-button w-full text-sm sm:text-base"
                  >
                    {type === "sign-in" ? "Sign In" : "Sign Up"}
                    {isLoading && <Loader2 className="ml-2 animate-spin" />}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    asChild
                  >
                    <Link prefetch href="/sign-in?autoSignIn=true">
                      <FaGoogle className="w-5 h-5" />
                      Continue with Google
                    </Link>
                  </Button>

                  {errorMessage && (
                    <p className="error-message">*{errorMessage}</p>
                  )}

                  <div className="flex-center space-x-1 text-sm sm:text-base">
                    <p className="text-light-100">
                      {type === "sign-in"
                        ? "Don't have an account?"
                        : "Already have an account?"}
                    </p>
                    <Link
                      prefetch
                      href={getAuthLink(
                        type === "sign-in" ? "sign-up" : "sign-in"
                      )}
                      className="font-medium text-brand hover:underline"
                    >
                      {type === "sign-in" ? "Sign Up" : "Sign In"}
                    </Link>
                  </div>
                  <Link
                    prefetch
                    href="/forgot-password"
                    className="text-sm text-brand "
                  >
                    Forgot Password?
                  </Link>
                </CardFooter>
              </form>
            </Form>

            {showOtpModal && (
              <OtpModal
                email={userEmail}
                role="user"
                referralCode={referralCode} // Pass referral code to OTP modal
                onVerified={verifyOTP}
                onResendOTP={resendOTP}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
