import { Elysia, t } from "elysia";
import { PlaylistsService } from "./playlists.service";
import { CreatePlaylistDto, UpdatePlaylistDto, AddPlaylistVideoDto } from "./dtos/playlists.dto";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const playlistsService = new PlaylistsService();

export const playlistsController = new Elysia({ prefix: "/api/playlists" })
  .use(authPlugin)
  .post(
    "/",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const playlist = await playlistsService.createPlaylist(user.userId, body as any);
      return ResponseUtil.created(playlist, "Playlist created successfully");
    },
    {
      body: CreatePlaylistDto,
      detail: {
        tags: ["Playlists"],
        summary: "Create a new playlist",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/",
    async ({ currentUser, query }) => {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const targetUserId = query.mine === "true" && currentUser ? currentUser.userId : query.userId;

      const result = await playlistsService.listPlaylists(page, limit, targetUserId);
      return ResponseUtil.success(result.playlists, "Playlists retrieved successfully", 200, result.meta);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        userId: t.Optional(t.String()),
        mine: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Playlists"],
        summary: "List public playlists or filter by user",
      },
    }
  )
  .get(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const playlist = await playlistsService.getPlaylistById(id, currentUser?.userId);
      return ResponseUtil.success(playlist, "Playlist retrieved successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Playlists"],
        summary: "Get playlist details with included videos",
      },
    }
  )
  .put(
    "/:id",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const playlist = await playlistsService.updatePlaylist(user.userId, user.role, id, body as any);
      return ResponseUtil.success(playlist, "Playlist updated successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdatePlaylistDto,
      detail: {
        tags: ["Playlists"],
        summary: "Update playlist details or visibility",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await playlistsService.deletePlaylist(user.userId, user.role, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Playlists"],
        summary: "Delete playlist",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/:id/videos",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const result = await playlistsService.addVideoToPlaylist(user.userId, user.role, id, body.videoId);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: AddPlaylistVideoDto,
      detail: {
        tags: ["Playlists"],
        summary: "Add video to playlist",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id/videos/:videoId",
    async ({ currentUser, params: { id, videoId } }) => {
      const user = requireAuth(currentUser);
      const result = await playlistsService.removeVideoFromPlaylist(user.userId, user.role, id, videoId);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
        videoId: t.String(),
      }),
      detail: {
        tags: ["Playlists"],
        summary: "Remove video from playlist",
        security: [{ BearerAuth: [] }],
      },
    }
  );
