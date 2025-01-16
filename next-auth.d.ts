import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "user" | "vendor";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: "user" | "vendor";
    email: string;
    name: string;
  }

  interface JWT {
    id: string;
    role?: "user" | "vendor";
  }
}
