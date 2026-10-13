import { Elysia } from "elysia";
import { swaggerPlugin } from "./common/plugins/swagger.plugin";
import { corsPlugin } from "./common/plugins/cors.plugin";
import { handleAppError } from "./common/plugins/error-handler.plugin";
import { rateLimiterPlugin } from "./common/middleware/rate-limiter.middleware";

// Feature Controllers
import { authController } from "./modules/auth/auth.controller";
import { usersController } from "./modules/users/users.controller";
import { channelsController } from "./modules/channels/channels.controller";
import { videosController } from "./modules/videos/videos.controller";
import { streamingController } from "./modules/videos/streaming.controller";
import {
  videoCommentsController,
  commentsController,
} from "./modules/comments/comments.controller";
import { playlistsController } from "./modules/playlists/playlists.controller";
import {
  channelSubscriptionsController,
  subscriptionsController,
} from "./modules/subscriptions/subscriptions.controller";
import { likesController } from "./modules/likes/likes.controller";
import { historiesController } from "./modules/histories/histories.controller";
import { notificationsController } from "./modules/notifications/notifications.controller";
import { uploadsController } from "./modules/uploads/uploads.controller";
import { analyticsController } from "./modules/analytics/analytics.controller";
import { searchController } from "./modules/search/search.controller";
import { ResponseUtil } from "./common/utils/response.util";

export const app = new Elysia()
  // Global Middleware & Plugins
  .use(corsPlugin)
  .use(rateLimiterPlugin)
  .onError(handleAppError)
  .use(swaggerPlugin)

  // System Health Check
  .get("/health", () => {
    return ResponseUtil.success(
      {
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      "YouTube Clone REST API is healthy"
    );
  })

  // Feature Modules
  .use(authController)
  .use(usersController)
  .use(channelsController)
  .use(videosController)
  .use(streamingController)
  .use(videoCommentsController)
  .use(commentsController)
  .use(playlistsController)
  .use(channelSubscriptionsController)
  .use(subscriptionsController)
  .use(likesController)
  .use(historiesController)
  .use(notificationsController)
  .use(uploadsController)
  .use(analyticsController)
  .use(searchController);

export type App = typeof app;
