import type { DefaultSession } from "next-auth";
import type { PermissionCode, RoleCode } from "@/lib/constants/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
      jobTitle: string;
      department: string;
      role: RoleCode;
      roleId: string;
      tokenVersion: number;
      permissions: PermissionCode[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    role: RoleCode;
    roleId: string;
    tokenVersion: number;
    permissions: PermissionCode[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    role: RoleCode;
    roleId: string;
    tokenVersion: number;
    permissions: PermissionCode[];
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
      jobTitle: string;
      department: string;
      role: RoleCode;
      roleId: string;
      tokenVersion: number;
      permissions: PermissionCode[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    role: RoleCode;
    roleId: string;
    tokenVersion: number;
    permissions: PermissionCode[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    role: RoleCode;
    roleId: string;
    tokenVersion: number;
    permissions: PermissionCode[];
  }
}
