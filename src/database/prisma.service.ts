import { PrismaClient } from "@prisma/client";
import { databaseConfig } from "../config/database.config";

class PrismaService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: databaseConfig.logLevels,
      });
    }
    return PrismaService.instance;
  }

  public static async connect(): Promise<void> {
    try {
      await PrismaService.getInstance().$connect();
      console.log("Connected to PostgreSQL via Prisma successfully");
    } catch (error) {
      console.error("Failed to connect to PostgreSQL:", error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      console.log("Disconnected from PostgreSQL");
    }
  }
}

export const prisma = PrismaService.getInstance();
export { PrismaService };
