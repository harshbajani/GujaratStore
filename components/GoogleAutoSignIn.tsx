"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface CredentialResponse {
  credential: string;
  select_by: string;
  client_id: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (
            callback: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              isDismissedMoment: () => boolean;
              getMomentType: () => string;
            }) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: string;
              theme: string;
              size: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GoogleAutoSignIn = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const autoSignIn = searchParams.get("autoSignIn");

  useEffect(() => {
    if (
      !session &&
      status !== "loading" &&
      typeof window !== "undefined" &&
      window.google?.accounts?.id
    ) {
      try {
        // Initialize Google One Tap
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: CredentialResponse) => {
            if (response.credential) {
              // Handle the sign-in with the credential
              try {
                const result = await signIn("google", {
                  credential: response.credential,
                  redirect: false,
                  callbackUrl: "/",
                });

                if (result?.error) {
                  toast({
                    title: "Error",
                    description: "Failed to sign in with Google",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Google sign-in error:", error);
                toast({
                  title: "Error",
                  description: "Failed to sign in with Google",
                  variant: "destructive",
                });
              }
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
        });

        // Prompt the One Tap dialog
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log(
              "One Tap dialog not displayed:",
              notification.getMomentType()
            );
          } else if (notification.isSkippedMoment()) {
            console.log(
              "One Tap dialog skipped:",
              notification.getMomentType()
            );
          } else if (notification.isDismissedMoment()) {
            console.log(
              "One Tap dialog dismissed:",
              notification.getMomentType()
            );
          }
        });
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
      }
    }
  }, [session, status, autoSignIn]);

  return null;
};

export default GoogleAutoSignIn;
