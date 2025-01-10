"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { resetPassword } from "@/lib/actions/auth.actions";
import { resetFormSchema } from "@/lib/validations";

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

const ResetPasswordForm = ({ email, token }: ResetPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof resetFormSchema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await resetPassword(email, token, values.password);

      if (result.success) {
        router.push("/sign-in");
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

  return (
    <div className="flex w-full flex-col">
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
        </div>
      </div>
      <div className="flex flex-1 w-full bg-[url('/bg/bg2.png')] bg-cover bg-center bg-no-repeat md:bg-[top_50%_right_200px]">
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-16 lg:py-12">
          <Card className="mx-auto w-full max-w-lg shadow-md">
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="auth-form"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            {...field}
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
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            {...field}
                          />
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
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>

                  {errorMessage && (
                    <p className="text-error text-sm text-center">
                      {errorMessage}
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
