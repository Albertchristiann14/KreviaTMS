import type { NextAuthConfig } from "next-auth";
import type { PermissionCode, RoleCode } from "@/lib/constants/permissions";

/**
 * Edge-safe Auth.js v5 base configuration (no Prisma or native Node hashing imports).
 * Shared between `src/proxy.ts` and `src/server/auth/auth.ts`.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days sliding session
    updateAge: 24 * 60 * 60, // Refresh JWT expiry every 24h on activity
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = user.avatarUrl;
        token.jobTitle = user.jobTitle;
        token.department = user.department;
        token.role = user.role;
        token.roleId = user.roleId;
        token.tokenVersion = user.tokenVersion;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
        session.user.avatarUrl = token.avatarUrl ?? null;
        session.user.jobTitle = token.jobTitle ?? "";
        session.user.department = token.department ?? "";
        session.user.role = token.role as RoleCode;
        session.user.roleId = token.roleId ?? "";
        session.user.tokenVersion = token.tokenVersion ?? 0;
        session.user.permissions = (token.permissions ?? []) as PermissionCode[];
      }
      return session;
    },
  },
};
