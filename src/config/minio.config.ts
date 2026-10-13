import { S3Client } from "@aws-sdk/client-s3";
import { ENV } from "./env.config";

export const s3Client = new S3Client({
  endpoint: `${ENV.MINIO_USE_SSL ? "https" : "http"}://${ENV.MINIO_ENDPOINT}:${ENV.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: ENV.MINIO_ACCESS_KEY,
    secretAccessKey: ENV.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const STORAGE_CONSTANTS = {
  BUCKET_NAME: ENV.MINIO_BUCKET,
  PREFIXES: {
    VIDEOS: "videos",
    THUMBNAILS: "thumbnails",
    AVATARS: "avatars",
    BANNERS: "banners",
    CHUNKS: "chunks",
    HLS: "hls",
  },
} as const;
