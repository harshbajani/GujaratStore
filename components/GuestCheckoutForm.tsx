"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";

interface GuestCheckoutFormProps {
  onSuccess: (userData: { id: string; email: string; name: string }) => void;
}

export default function GuestCheckoutForm({
  onSuccess,
}: GuestCheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a secure random password for the guest user
      const password = Math.random().toString(36).slice(-12);

      // Register the guest user
      const response = await fetch("/api/auth/guest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create account");
      }

      // Sign in the newly created user
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: password,
        role: "user",
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast({
        title: "Account created successfully",
        description: "You can now complete your checkout",
      });

      onSuccess(data.data);
    } catch (error) {
      console.error("Guest checkout error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter your name"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="Enter your email"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          placeholder="Enter your phone number"
          maxLength={10}
        />
      </div>
      <Button type="submit" className="w-full primary-btn" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Continue to Checkout"}
      </Button>
      <p className="text-sm text-gray-500 text-center mt-2">
        A temporary password will be sent to your email
      </p>
    </form>
  );
}
