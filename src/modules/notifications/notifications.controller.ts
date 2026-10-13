import { Elysia, t } from "elysia";
import { NotificationsService } from "./notifications.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const notificationsService = new NotificationsService();

export const notificationsController = new Elysia({ prefix: "/api/notifications" })
  .use(authPlugin)
  .get(
    "/",
    async ({ currentUser, query }) => {
      const user = requireAuth(currentUser);
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const result = await notificationsService.getNotifications(user.userId, page, limit);
      return ResponseUtil.success(
        {
          notifications: result.notifications,
          unreadCount: result.unreadCount,
        },
        "Notifications retrieved successfully",
        200,
        result.meta
      );
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Notifications"],
        summary: "Get notifications for authenticated user",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .patch(
    "/read-all",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      const result = await notificationsService.markAllAsRead(user.userId);
      return ResponseUtil.success(result, result.message);
    },
    {
      detail: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .patch(
    "/:id/read",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await notificationsService.markAsRead(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Notifications"],
        summary: "Mark specific notification as read",
        security: [{ BearerAuth: [] }],
      },
    }
  );
