// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    passwordHash: string;
    isSuspended: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  }
}