import { Elysia, t } from "elysia";
import { VideosService } from "./videos.service";
import { CreateVideoDto, UpdateVideoDto, VideoQueryDto } from "./dtos/videos.dto";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const videosService = new VideosService();

export const videosController = new Elysia({ prefix: "/api/videos" })
  .use(authPlugin)
  .post(
    "/",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const video = await videosService.createVideo(user.userId, body as any);
      return ResponseUtil.created(video, "Video created and published successfully");
    },
    {
      body: CreateVideoDto,
      detail: {
        tags: ["Videos"],
        summary: "Publish a new video to user channel",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/trending",
    async ({ query }) => {
      const limit = Number(query.limit) || 10;
      const videos = await videosService.getTrendingVideos(limit);
      return ResponseUtil.success(videos, "Trending videos retrieved successfully");
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get trending videos (cached in Redis)",
      },
    }
  )
  .get(
    "/popular",
    async ({ query }) => {
      const limit = Number(query.limit) || 10;
      const videos = await videosService.getPopularVideos(limit);
      return ResponseUtil.success(videos, "Popular videos retrieved successfully");
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get popular videos ordered by views",
      },
    }
  )
  .get(
    "/recommendations",
    async ({ currentUser, query }) => {
      const limit = Number(query.limit) || 10;
      const videos = await videosService.getRecommendations(currentUser?.userId, limit);
      return ResponseUtil.success(videos, "Recommended videos retrieved successfully");
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get personalized or general recommended videos",
      },
    }
  )
  .get(
    "/",
    async ({ query }) => {
      const result = await videosService.listVideos({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        search: query.search,
        category: query.category,
        tag: query.tag,
        channelId: query.channelId,
        sort: query.sort as any,
      });
      return ResponseUtil.success(result.videos, "Videos retrieved successfully", 200, result.meta);
    },
    {
      query: VideoQueryDto,
      detail: {
        tags: ["Videos"],
        summary: "List public videos with search, tag, category and sort filters",
      },
    }
  )
  .get(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const video = await videosService.getVideoById(id, currentUser?.userId);
      return ResponseUtil.success(video, "Video retrieved successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get video details by ID",
      },
    }
  )
  .get(
    "/:id/related",
    async ({ params: { id }, query }) => {
      const limit = Number(query.limit) || 8;
      const related = await videosService.getRelatedVideos(id, limit);
      return ResponseUtil.success(related, "Related videos retrieved successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get related videos by matching category and tags",
      },
    }
  )
  .post(
    "/:id/views",
    async ({ params: { id } }) => {
      const result = await videosService.recordView(id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Increment video view count",
      },
    }
  )
  .put(
    "/:id",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const updated = await videosService.updateVideo(user.userId, user.role, id, body as any);
      return ResponseUtil.success(updated, "Video updated successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateVideoDto,
      detail: {
        tags: ["Videos"],
        summary: "Update video metadata, visibility or status",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await videosService.deleteVideo(user.userId, user.role, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Delete video",
        security: [{ BearerAuth: [] }],
      },
    }
  );
