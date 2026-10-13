import { swagger } from "@elysiajs/swagger";

export const swaggerPlugin = swagger({
  documentation: {
    info: {
      title: "YouTube Clone REST API",
      version: "1.0.0",
      description:
        "Production-ready YouTube Clone REST API built with ElysiaJS, TypeScript, PostgreSQL, Prisma, Redis, and MinIO.",
      contact: {
        name: "API Support",
        email: "support@youtubeclone.dev",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    tags: [
      { name: "Auth", description: "Authentication and authorization operations" },
      { name: "Users", description: "User profile and account operations" },
      { name: "Channels", description: "Channel creation, details, and subscriptions" },
      { name: "Videos", description: "Video uploading, streaming, and metadata management" },
      { name: "Comments", description: "Video commenting, replies, reactions, and pinning" },
      { name: "Playlists", description: "Playlist management and video curation" },
      { name: "Subscriptions", description: "Channel subscriptions and subscriber tracking" },
      { name: "Likes", description: "Video likes and reactions" },
      { name: "Histories", description: "Watch history tracking and management" },
      { name: "Notifications", description: "User activity and system notifications" },
      { name: "Uploads", description: "MinIO S3 multipart, chunk, and media file uploads" },
      { name: "Analytics", description: "Creator and Admin analytics dashboards" },
      { name: "Search", description: "Full-text multi-criteria search engine" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your Bearer JWT token in the format: Bearer <token>",
        },
      },
    },
  },
  path: "/swagger",
});
