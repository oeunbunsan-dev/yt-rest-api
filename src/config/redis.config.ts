import { ENV } from "./env.config";
import type { RedisOptions } from "ioredis";

export const redisConfig: RedisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  db: ENV.REDIS_DB,
  retryStrategy: (times) => {
    // Retry with exponential backoff up to 2 seconds
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};
