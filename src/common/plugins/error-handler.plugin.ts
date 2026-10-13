import { HttpException } from "../exceptions/http.exception";
import { ResponseUtil } from "../utils/response.util";

export function handleAppError({
  code,
  error,
  set,
}: {
  code: string;
  error: any;
  set: { status?: number | string };
}) {
  // Custom HttpException or errors with statusCode
  if (error instanceof HttpException || (error && typeof error.statusCode === "number")) {
    const statusCode = error.statusCode || 500;
    set.status = statusCode;
    return ResponseUtil.error(error.message, statusCode, error.errors);
  }

  // Prisma Unique Constraint Violation
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    set.status = 409;
    const target = error.meta?.target;
    const fieldMsg = Array.isArray(target) ? `Field(s) '${target.join(", ")}' already exist` : "Unique constraint failed";
    return ResponseUtil.error(`Conflict: ${fieldMsg}`, 409);
  }

  // Prisma Record Not Found
  if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
    set.status = 404;
    return ResponseUtil.error("The requested resource was not found", 404);
  }

  // Elysia Validation Error
  if (code === "VALIDATION") {
    set.status = 422;
    return ResponseUtil.error("Validation error", 422, error.all || error.message);
  }

  // Elysia Route Not Found
  if (code === "NOT_FOUND") {
    set.status = 404;
    return ResponseUtil.error("Endpoint not found", 404);
  }

  console.error("Unhandled Server Error:", error);
  set.status = 500;
  return ResponseUtil.error(
    process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    500
  );
}
