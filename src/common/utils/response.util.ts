export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    cursor?: string | null;
    [key: string]: unknown;
  };
  errors?: unknown;
  timestamp: string;
}

export function sanitizeBigInt<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return Number(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeBigInt(item)) as unknown as T;
  }

  if (typeof data === "object" && !(data instanceof Date)) {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      copy[key] = sanitizeBigInt(value);
    }
    return copy as T;
  }

  return data;
}

export class ResponseUtil {
  public static success<T>(
    data: T,
    message = "Request successful",
    statusCode = 200,
    meta?: ApiResponse["meta"]
  ): ApiResponse<T> {
    const sanitizedData = sanitizeBigInt(data);
    return {
      success: true,
      statusCode,
      message,
      data: sanitizedData,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  public static created<T>(
    data: T,
    message = "Resource created successfully"
  ): ApiResponse<T> {
    return ResponseUtil.success(data, message, 201);
  }

  public static error(
    message = "An error occurred",
    statusCode = 500,
    errors?: unknown
  ): ApiResponse<null> {
    return {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}
