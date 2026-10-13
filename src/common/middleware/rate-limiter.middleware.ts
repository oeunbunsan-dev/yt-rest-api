import { Elysia } from "elysia";
import { RedisService } from "../../database/redis.service";
import { ENV } from "../../config/env.config";
import { TooManyRequestsException } from "../exceptions/app-errors";

export const rateLimiterPlugin = new Elysia({ name: "rate-limiter" }).onBeforeHandle(
  async ({ request, set }) => {
    // Extract client IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "127.0.0.1";
    const key = `ratelimit:${ip || "unknown"}`;

    try {
      const current = await RedisService.incr(key);
      if (current === 1) {
        await RedisService.expire(key, ENV.RATE_LIMIT_WINDOW_SEC);
      }

      set.headers["X-RateLimit-Limit"] = String(ENV.RATE_LIMIT_MAX);
      set.headers["X-RateLimit-Remaining"] = String(Math.max(0, ENV.RATE_LIMIT_MAX - current));

      if (current > ENV.RATE_LIMIT_MAX) {
        throw new TooManyRequestsException(
          `Rate limit exceeded. Maximum ${ENV.RATE_LIMIT_MAX} requests per ${ENV.RATE_LIMIT_WINDOW_SEC} seconds.`
        );
      }
    } catch (err) {
      if (err instanceof TooManyRequestsException) {
        throw err;
      }
      // If Redis has temporary connection issue, allow the request to proceed without downtime
    }
  }
);
