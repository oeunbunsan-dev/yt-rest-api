import { Elysia, t } from "elysia";
import { HistoriesService } from "./histories.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const historiesService = new HistoriesService();

export const historiesController = new Elysia({ prefix: "/api/histories" })
  .use(authPlugin)
  .post(
    "/videos/:id",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const watchedDuration = Number((body as any)?.watchedDuration) || 0;
      const history = await historiesService.recordHistory(user.userId, id, watchedDuration);
      return ResponseUtil.success(history, "Watch history recorded");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Optional(
        t.Object({
          watchedDuration: t.Optional(t.Numeric()),
        })
      ),
      detail: {
        tags: ["Histories"],
        summary: "Record or update video watch history",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/",
    async ({ currentUser, query }) => {
      const user = requireAuth(currentUser);
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const result = await historiesService.getHistory(user.userId, page, limit);
      return ResponseUtil.success(result.history, "Watch history retrieved successfully", 200, result.meta);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Histories"],
        summary: "Get current user watch history",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/clear",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      const result = await historiesService.clearHistory(user.userId);
      return ResponseUtil.success(result, result.message);
    },
    {
      detail: {
        tags: ["Histories"],
        summary: "Clear all watch history for user",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await historiesService.removeHistoryItem(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Histories"],
        summary: "Remove individual item from watch history",
        security: [{ BearerAuth: [] }],
      },
    }
  );
