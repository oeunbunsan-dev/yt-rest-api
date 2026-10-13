import { Elysia, t } from "elysia";
import { prisma } from "../../database/prisma.service";
import { ResponseUtil } from "../../common/utils/response.util";
import { PaginationUtil } from "../../common/utils/pagination.util";

export const searchController = new Elysia({ prefix: "/api/search" }).get(
  "/",
  async ({ query }) => {
    const q = query.q?.trim() || "";
    const type = query.type || "all";
    const category = query.category;
    const tag = query.tag;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { skip } = PaginationUtil.parsePagination({ page, limit });

    let videos: any[] = [];
    let channels: any[] = [];
    let playlists: any[] = [];

    const videoWhere: any = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    };

    if (q) {
      videoWhere.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) {
      videoWhere.category = { equals: category, mode: "insensitive" };
    }

    if (tag) {
      videoWhere.tags = { has: tag };
    }

    if (type === "all" || type === "video") {
      videos = await prisma.video.findMany({
        where: videoWhere,
        skip,
        take: limit,
        orderBy: { views: "desc" },
        include: {
          channel: {
            select: { id: true, name: true, handle: true, avatar: true },
          },
        },
      });
    }

    if (type === "all" || type === "channel") {
      const channelWhere: any = {};
      if (q) {
        channelWhere.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { handle: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }

      channels = await prisma.channel.findMany({
        where: channelWhere,
        skip,
        take: limit,
        orderBy: { subscribersCount: "desc" },
      });
    }

    if (type === "all" || type === "playlist") {
      const playlistWhere: any = { visibility: "PUBLIC" };
      if (q) {
        playlistWhere.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }

      playlists = await prisma.playlist.findMany({
        where: playlistWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });
    }

    return ResponseUtil.success(
      {
        query: q,
        type,
        category,
        tag,
        results: {
          videos,
          channels,
          playlists,
        },
      },
      "Search results retrieved successfully"
    );
  },
  {
    query: t.Object({
      q: t.Optional(t.String()),
      type: t.Optional(t.Union([t.Literal("all"), t.Literal("video"), t.Literal("channel"), t.Literal("playlist")])),
      category: t.Optional(t.String()),
      tag: t.Optional(t.String()),
      page: t.Optional(t.Numeric()),
      limit: t.Optional(t.Numeric()),
    }),
    detail: {
      tags: ["Search"],
      summary: "Unified search across videos, channels, and playlists by keywords, tags, or categories",
    },
  }
);
