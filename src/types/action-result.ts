export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "PERIOD_LOCKED"
  | "INTERNAL_ERROR";

export type FieldErrors = Record<string, string[]>;

export type ActionResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fieldErrors?: FieldErrors;
      };
    };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

export function fail(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: FieldErrors
): ActionResult<never> {
  return {
    success: false,
    error: { code, message, fieldErrors },
  };
}

export class DomainError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message: string,
    public readonly fieldErrors?: FieldErrors
  ) {
    super(message);
    this.name = "DomainError";
  }
}
