import User from "@/lib/models/user.model";
import Vendor from "@/lib/models/vendor.model";
import { connectToDB } from "@/lib/mongodb";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
