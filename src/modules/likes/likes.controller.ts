import { Elysia, t } from "elysia";
import { LikesService } from "./likes.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const likesService = new LikesService();

export const likesController = new Elysia({ prefix: "/api/videos" })
  .use(authPlugin)
  .post(
    "/:id/like",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await likesService.likeVideo(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Likes"],
        summary: "Like video",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id/like",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await likesService.unlikeVideo(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Likes"],
        summary: "Unlike video",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/liked",
    async ({ currentUser, query }) => {
      const user = requireAuth(currentUser);
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const result = await likesService.getLikedVideos(user.userId, page, limit);
      return ResponseUtil.success(result.videos, "Liked videos retrieved successfully", 200, result.meta);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Likes"],
        summary: "Get current user's liked videos",
        security: [{ BearerAuth: [] }],
      },
    }
  );
