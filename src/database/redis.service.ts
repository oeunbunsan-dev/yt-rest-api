import Redis from "ioredis";
import { redisConfig } from "../config/redis.config";

class RedisService {
  private static instance: Redis | null = null;
  private static isConnected: boolean = false;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis(redisConfig);

      RedisService.instance.on("connect", () => {
        RedisService.isConnected = true;
        console.log("Connected to Redis successfully");
      });

      RedisService.instance.on("error", (err) => {
        RedisService.isConnected = false;
        console.warn("Redis connection warning/error:", err.message);
      });
    }
    return RedisService.instance;
  }

  public static async connect(): Promise<void> {
    const client = RedisService.getInstance();
    if (client.status === "wait") {
      await client.connect().catch((err) => {
        console.warn("Non-fatal: Could not eagerly connect to Redis:", err.message);
      });
    }
  }

  public static async get<T>(key: string): Promise<T | null> {
    try {
      const client = RedisService.getInstance();
      const val = await client.get(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  public static async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const client = RedisService.getInstance();
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await client.set(key, serialized);
      }
    } catch (err) {
      console.warn(`Redis set failed for key ${key}:`, err);
    }
  }

  public static async del(key: string): Promise<void> {
    try {
      const client = RedisService.getInstance();
      await client.del(key);
    } catch (err) {
      console.warn(`Redis del failed for key ${key}:`, err);
    }
  }

  public static async delPattern(pattern: string): Promise<void> {
    try {
      const client = RedisService.getInstance();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      console.warn(`Redis delPattern failed for ${pattern}:`, err);
    }
  }

  public static async incr(key: string): Promise<number> {
    try {
      const client = RedisService.getInstance();
      return await client.incr(key);
    } catch {
      return 1;
    }
  }

  public static async expire(key: string, seconds: number): Promise<void> {
    try {
      const client = RedisService.getInstance();
      await client.expire(key, seconds);
    } catch {
      // ignore
    }
  }

  public static async cacheAside<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await RedisService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await RedisService.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  public static async disconnect(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.quit().catch(() => {});
      console.log("Disconnected from Redis");
    }
  }
}

export const redis = RedisService.getInstance();
export { RedisService };
