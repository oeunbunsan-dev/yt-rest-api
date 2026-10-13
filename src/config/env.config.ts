import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  HOST: process.env.HOST || "0.0.0.0",
  APP_URL: process.env.APP_URL || "http://localhost:3000",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/youtube_clone?schema=public",

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB || "0", 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-youtube-jwt-access-key-2026",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "super-secret-youtube-jwt-refresh-key-2026",
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  // MinIO / S3 Storage
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "localhost",
  MINIO_PORT: parseInt(process.env.MINIO_PORT || "9000", 10),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minioadmin",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "minioadmin",
  MINIO_BUCKET: process.env.MINIO_BUCKET || "youtube-clone-assets",
  MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL || "http://localhost:9000/youtube-clone-assets",

  // Rate Limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  RATE_LIMIT_WINDOW_SEC: parseInt(process.env.RATE_LIMIT_WINDOW_SEC || "60", 10),
};
