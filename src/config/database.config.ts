import { ENV } from "./env.config";

export const databaseConfig = {
  url: ENV.DATABASE_URL,
  logLevels: (ENV.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]) as (
    | "query"
    | "info"
    | "warn"
    | "error"
  )[],
};
