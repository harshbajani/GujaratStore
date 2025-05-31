import User from "@/lib/models/user.model";
import Vendor from "@/lib/models/vendor.model";
import { connectToDB } from "@/lib/mongodb";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user", // Default role for Google auth
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, password, role } = credentials;

        try {
          await connectToDB();

          const Model = role === "vendor" ? Vendor : User;
          const account = await Model.findOne({
            email,
            role,
          });

          if (!account) {
            throw new Error("Invalid credentials");
          }

          if (account.password !== password) {
            throw new Error("Invalid credentials");
          }

          if (role === "vendor" && !account.isVerified) {
            throw new Error("Please verify your email before signing in");
          }

          return {
            id: account._id.toString(),
            email: account.email,
            name: account.name,
            role: account.role as "user" | "vendor",
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDB();

          // Check if user exists
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user with Google profile data
            await User.create({
              name: user.name,
              email: user.email,
              phone: "", // You might want to collect this later
              password: "", // No password for Google auth
              role: "user",
              isVerified: true, // Google accounts are pre-verified
            });
          }
          return true;
        } catch (error) {
          console.error("Error in Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (account?.provider === "google") {
        token.role = "user"; // Set default role for Google users
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as "user" | "vendor" | undefined,
        },
      };
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
