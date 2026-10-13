import { Elysia, t } from "elysia";
import { SubscriptionsService } from "./subscriptions.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const subscriptionsService = new SubscriptionsService();

export const channelSubscriptionsController = new Elysia({ prefix: "/api/channels" })
  .use(authPlugin)
  .post(
    "/:id/subscribe",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await subscriptionsService.subscribe(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Subscribe to channel",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id/subscribe",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await subscriptionsService.unsubscribe(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Unsubscribe from channel",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id/subscribers/count",
    async ({ params: { id } }) => {
      const result = await subscriptionsService.getSubscriberCount(id);
      return ResponseUtil.success(result, "Subscriber count retrieved");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Get channel subscriber count",
      },
    }
  );

export const subscriptionsController = new Elysia({ prefix: "/api/subscriptions" })
  .use(authPlugin)
  .get(
    "/channels",
    async ({ currentUser, query }) => {
      const user = requireAuth(currentUser);
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const result = await subscriptionsService.getSubscribedChannels(user.userId, page, limit);
      return ResponseUtil.success(result.subscriptions, "Subscribed channels retrieved", 200, result.meta);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Get current user's subscribed channels",
        security: [{ BearerAuth: [] }],
      },
    }
  );
