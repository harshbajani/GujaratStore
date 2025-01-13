import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/actions/user.actions";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserResponse } from "@/types";
import { signOut } from "next-auth/react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileProps {
  initialData: UserResponse;
  onProfileUpdate: (updatedUser: UserResponse) => void;
}

const Profile = ({ initialData, onProfileUpdate }: ProfileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const updates: Partial<ProfileFormValues> = {};
      const isEmailChanged = values.email !== initialData?.email;

      if (values.name !== initialData?.name) updates.name = values.name;
      if (isEmailChanged) updates.email = values.email;
      if (values.phone !== initialData?.phone) updates.phone = values.phone;

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your profile",
        });
        setIsLoading(false);
        return;
      }

      const result = await updateUserProfile(updates);

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });

        onProfileUpdate(result.data);

        // If email was changed, sign out the user and redirect to login
        if (isEmailChanged) {
          toast({
            title: "Email Updated",
            description: "Please sign in again with your new email",
          });
          await signOut({ callbackUrl: "/sign-in" });
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
                {field.value !== initialData.email && (
                  <p className="text-sm text-error">
                    Note: Changing your email will require you to sign in again
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact No.</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Profile;
