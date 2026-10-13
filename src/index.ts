import { app } from "./app";
import { ENV } from "./config/env.config";
import { PrismaService } from "./database/prisma.service";
import { RedisService } from "./database/redis.service";
import { UploadsService } from "./modules/uploads/uploads.service";

async function bootstrap() {
  console.log("🚀 Initializing YouTube Clone REST API services...");

  // Eagerly connect to database & cache
  await PrismaService.connect();
  await RedisService.connect();

  // Ensure MinIO asset storage bucket exists
  await UploadsService.ensureBucketExists().catch((err) => {
    console.warn("Storage notice: MinIO initialization postponed until container online:", err.message);
  });

  // Start HTTP Server
  app.listen(
    {
      port: ENV.PORT,
      hostname: ENV.HOST,
    },
    ({ hostname, port }) => {
      console.log(`\n======================================================`);
      console.log(`🎬 YouTube Clone REST API is running!`);
      console.log(`📡 URL:       http://${hostname}:${port}`);
      console.log(`📖 Swagger:   http://${hostname}:${port}/swagger`);
      console.log(`❤️  Health:    http://${hostname}:${port}/health`);
      console.log(`⚙️  Env:       ${ENV.NODE_ENV}`);
      console.log(`======================================================\n`);
    }
  );

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    await PrismaService.disconnect();
    await RedisService.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
