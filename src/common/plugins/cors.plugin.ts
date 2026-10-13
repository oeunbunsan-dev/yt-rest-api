import { cors } from "@elysiajs/cors";

export const corsPlugin = cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Range"],
  exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"],
  credentials: true,
});
