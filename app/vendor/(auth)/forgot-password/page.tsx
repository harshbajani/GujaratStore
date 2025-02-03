"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import OtpModal from "@/components/OTPModal";
import { initiatePasswordReset } from "@/lib/actions/vendorAuth.actions";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPasswordForm = () => {
  // * useStates and hooks
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  // * forgot password form submit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await initiatePasswordReset(values.email);

      if (result.success) {
        setEmail(values.email);
        setShowOtpModal(true);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    return { success: true, message: "Password reset successfull" };
  };

  return (
    <div className="w-full min-h-screen lg:min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
      <Card className="w-full max-w-md lg:max-w-lg shadow-md">
        <CardHeader className="space-y-2 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl text-center lg:text-left">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full form-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Instructions...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              {errorMessage && (
                <p className="text-error text-sm text-center">{errorMessage}</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      {showOtpModal && (
        <OtpModal
          email={email}
          type="password-reset"
          role="vendor"
          onVerified={handlePasswordReset}
          onResendOTP={(email) => initiatePasswordReset(email)}
        />
      )}
    </div>
  );
};

export default ForgotPasswordForm;
