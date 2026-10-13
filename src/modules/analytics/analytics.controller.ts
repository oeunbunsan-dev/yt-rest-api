import { Elysia } from "elysia";
import { AnalyticsService } from "./analytics.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { requireAdmin } from "../../common/middleware/role.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const analyticsService = new AnalyticsService();

export const analyticsController = new Elysia({ prefix: "/api/analytics" })
  .use(authPlugin)
  .get(
    "/creator",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      const dashboard = await analyticsService.getCreatorDashboard(user.userId);
      return ResponseUtil.success(dashboard, "Creator analytics retrieved successfully");
    },
    {
      detail: {
        tags: ["Analytics"],
        summary: "Get creator dashboard metrics and top video performance",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/admin",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      requireAdmin(user);
      const dashboard = await analyticsService.getAdminDashboard();
      return ResponseUtil.success(dashboard, "Admin analytics retrieved successfully");
    },
    {
      detail: {
        tags: ["Analytics"],
        summary: "Get platform-wide admin metrics and storage analytics (Admin Only)",
        security: [{ BearerAuth: [] }],
      },
    }
  );
