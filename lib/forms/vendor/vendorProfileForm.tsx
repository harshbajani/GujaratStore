"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateVendorProfile } from "@/lib/actions/vendor.actions";
import { signOut } from "next-auth/react";
import { useVendorDetails } from "@/hooks/useVendorDetails";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User2, Mail, Phone, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const vendorProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

type ProfileFormValues = z.infer<typeof vendorProfileSchema>;

const VendorProfileForm = () => {
  // * useStates and hooks
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, refetch } = useVendorDetails();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // * Update form values when user data is available
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, form]);

  // * Submit form for vendor
  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const updates: Partial<ProfileFormValues> = {};
      const isEmailChanged = values.email !== user?.email;

      if (values.name !== user?.name) updates.name = values.name;
      if (isEmailChanged) updates.email = values.email;
      if (values.phone !== user?.phone) updates.phone = values.phone;

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your profile",
        });
        setIsLoading(false);
        return;
      }

      const result = await updateVendorProfile(updates);

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });

        // * Trigger refetch to update vendor details globally
        await refetch();

        if (isEmailChanged) {
          toast({
            title: "Email Updated",
            description: "Please sign in again with your new email",
          });
          await signOut({ callbackUrl: "/vendor/sign-in" });
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-brand/5 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-playfair">
                  Account Settings
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage your profile and preferences
                </CardDescription>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-4 ">
                  <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
                    <User2 className="w-8 h-8 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">Store Owner</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <div className="relative flex items-center">
                        <User2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input {...field} className="bg-muted/50 pl-10" />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Store Settings */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input {...field} className="bg-muted/50 pl-10" />
                        </FormControl>
                        <FormMessage />
                        {field.value !== user?.email && (
                          <p className="text-sm text-error">
                            Note: Changing your email will require you to sign
                            in again
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            className="bg-muted/50 pl-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-end justify-end">
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link prefetch href="/vendor/dashboard">
                  Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                className="bg-brand hover:bg-brand/90"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default VendorProfileForm;
