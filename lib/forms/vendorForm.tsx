"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { authFormSchema, FormType } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { resendOTP, signUp, verifyOTP } from "../actions/vendorAuth.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import OtpModal from "@/components/OTPModal";

const VendorForm = ({ type }: { type: FormType }) => {
  // * useState and hooks
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [vendorEmail, setVendorEmail] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = authFormSchema(type);
  type FormValues = z.infer<typeof formSchema>;

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
          role: "vendor",
        });

        if (result.success) {
          toast({ title: "Success", description: "Signed Up successfully" });
          setVendorEmail(values.email);
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
          role: "vendor",
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
          window.location.href = "/vendor/dashboard";
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

  return (
    <div className="w-full min-h-screen lg:min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
      <Card className="w-full max-w-md lg:max-w-lg shadow-md">
        <CardHeader className="space-y-2 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl text-center lg:text-left">
            {type === "sign-in" ? "Sign In" : "Sign Up"} to account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-center lg:text-left">
            {type === "sign-in"
              ? "Enter your email & password to sign in"
              : "Enter your details to sign up with us"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-4 px-4 sm:px-6">
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
              <Button
                type="submit"
                disabled={isLoading}
                className="primary-btn w-full"
              >
                {type === "sign-in" ? "Sign In" : "Sign Up"}
                {isLoading && <Loader2 className="ml-2 animate-spin" />}
              </Button>
            </CardContent>
          </form>
        </Form>

        <CardFooter className="flex flex-col space-y-4 px-4 pb-6 sm:px-6 sm:pb-8">
          {errorMessage && (
            <p className="text-red-500 text-sm">*{errorMessage}</p>
          )}

          <div className="flex-center space-x-1 text-sm sm:text-base">
            <p className="text-light-100">
              {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type === "sign-in" ? "/vendor/sign-up" : "/vendor/sign-in"}
              className="font-medium text-brand hover:underline"
            >
              {type === "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
          <Link href="/vendor/forgot-password" className="text-sm text-brand">
            Forgot Password?
          </Link>
        </CardFooter>

        {showOtpModal && (
          <OtpModal
            email={vendorEmail}
            role="vendor"
            onVerified={verifyOTP}
            onResendOTP={resendOTP}
          />
        )}
      </Card>
    </div>
  );
};

export default VendorForm;
