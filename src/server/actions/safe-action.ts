import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { PermissionCode } from "@/lib/constants/permissions";
import {
  requirePermission,
  requireSession,
  type AuthContext,
} from "@/server/auth/rbac";
import {
  DomainError,
  fail,
  ok,
  type ActionResult,
  type FieldErrors,
} from "@/types/action-result";

export interface ProtectedActionOptions<
  TSchema extends z.ZodType,
  TOutput,
> {
  /**
   * Required RBAC permission(s). Omit or pass `null` for authenticated-self actions.
   */
  permission?: PermissionCode | readonly PermissionCode[] | null;
  schema: TSchema;
  handler: (context: {
    user: AuthContext;
    ctx: AuthContext;
    input: z.infer<TSchema>;
  }) => Promise<{ data: TOutput; message?: string }>;
}

function mapZodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    const existing = fieldErrors[key];
    if (existing) {
      existing.push(issue.message);
    } else {
      fieldErrors[key] = [issue.message];
    }
  }
  return fieldErrors;
}

/**
 * Standard server action wrapper enforcing Auth + RBAC + Zod validation + Prisma/Domain error mapping.
 */
export function createProtectedAction<TSchema extends z.ZodType, TOutput>(
  options: ProtectedActionOptions<TSchema, TOutput>
) {
  return async (rawInput: z.input<TSchema>): Promise<ActionResult<TOutput>> => {
    try {
      const user = options.permission
        ? await requirePermission(options.permission)
        : await requireSession();

      const parsed = options.schema.safeParse(rawInput);
      if (!parsed.success) {
        return fail(
          "VALIDATION_ERROR",
          "Input tidak valid. Periksa kembali kolom yang ditandai.",
          mapZodFieldErrors(parsed.error)
        );
      }

      const result = await options.handler({
        user,
        ctx: user,
        input: parsed.data,
      });

      return ok(result.data, result.message);
    } catch (err) {
      if (err instanceof DomainError) {
        return fail(err.code, err.message, err.fieldErrors);
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return fail(
            "CONFLICT",
            "Data duplikat terdeteksi pada kolom unik."
          );
        }
        if (err.code === "P2025") {
          return fail(
            "NOT_FOUND",
            "Data yang diminta tidak ditemukan atau sudah dihapus."
          );
        }
      }

      console.error("[KTMS_ACTION_ERROR]", err);
      return fail(
        "INTERNAL_ERROR",
        "Terjadi kesalahan sistem internal. Silakan coba lagi."
      );
    }
  };
}
