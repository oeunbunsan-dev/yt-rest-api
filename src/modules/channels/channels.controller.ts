import { Elysia, t } from "elysia";
import { ChannelsService } from "./channels.service";
import { CreateChannelDto, UpdateChannelDto } from "./dtos/channels.dto";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const channelsService = new ChannelsService();

export const channelsController = new Elysia({ prefix: "/api/channels" })
  .use(authPlugin)
  .post(
    "/",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const channel = await channelsService.createChannel(user.userId, body);
      return ResponseUtil.created(channel, "Channel created successfully");
    },
    {
      body: CreateChannelDto,
      detail: {
        tags: ["Channels"],
        summary: "Create a new channel for authenticated user",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/me",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      const channel = await channelsService.getMyChannel(user.userId);
      return ResponseUtil.success(channel, "Channel retrieved successfully");
    },
    {
      detail: {
        tags: ["Channels"],
        summary: "Get currently logged-in user channel",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      // Support looking up either by unique handle or by UUID
      const cleanIdentifier = id.startsWith("@") ? id.slice(1) : id;
      try {
        const channel = await channelsService.getChannelByHandle(cleanIdentifier);
        return ResponseUtil.success(channel, "Channel retrieved successfully");
      } catch {
        const channel = await channelsService.getChannelById(cleanIdentifier);
        return ResponseUtil.success(channel, "Channel retrieved successfully");
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Channels"],
        summary: "Get channel profile by unique handle or channel ID",
      },
    }
  )
  .put(
    "/:id",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const channel = await channelsService.updateChannel(user.userId, id, user.role, body);
      return ResponseUtil.success(channel, "Channel updated successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateChannelDto,
      detail: {
        tags: ["Channels"],
        summary: "Update channel details",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await channelsService.deleteChannel(user.userId, id, user.role);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Channels"],
        summary: "Delete channel",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id/videos",
    async ({ params: { id }, query }) => {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const result = await channelsService.getChannelVideos(id, page, limit);
      return ResponseUtil.success(result.videos, "Channel videos retrieved successfully", 200, result.meta);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Channels"],
        summary: "Get public videos published by channel",
      },
    }
  );
