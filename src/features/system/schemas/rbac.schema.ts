import { z } from "zod";
import { PERMISSION_CODES } from "@/lib/constants/permissions";

export const updateRolePermissionsSchema = z.object({
  roleId: z.string().uuid("ID peran tidak valid."),
  permissionCodes: z
    .array(z.enum(PERMISSION_CODES))
    .transform((codes) => Array.from(new Set(codes))),
});

export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
