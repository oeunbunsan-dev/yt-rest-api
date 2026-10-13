import { prisma } from "../../database/prisma.service";
import type { Prisma, Video } from "@prisma/client";

export class VideosRepository {
  public async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return await prisma.video.create({
      data,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async findById(id: string): Promise<Video | null> {
    return await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            userId: true,
            name: true,
            handle: true,
            avatar: true,
            subscribersCount: true,
          },
        },
      },
    });
  }

  public async findByIdWithDetails(id: string, currentUserId?: string) {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            userId: true,
            name: true,
            handle: true,
            avatar: true,
            subscribersCount: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!video) return null;

    let isLiked = false;
    let isSubscribed = false;

    if (currentUserId) {
      const [likeRecord, subRecord] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_videoId: {
              userId: currentUserId,
              videoId: id,
            },
          },
        }),
        prisma.subscription.findUnique({
          where: {
            subscriberId_channelId: {
              subscriberId: currentUserId,
              channelId: video.channelId,
            },
          },
        }),
      ]);

      isLiked = !!likeRecord;
      isSubscribed = !!subRecord;
    }

    return {
      ...video,
      likesCount: video._count.likes,
      commentsCount: video._count.comments,
      isLiked,
      isSubscribed,
    };
  }

  public async update(id: string, data: Prisma.VideoUpdateInput): Promise<Video> {
    return await prisma.video.update({
      where: { id },
      data,
      include: {
        channel: true,
      },
    });
  }

  public async delete(id: string): Promise<Video> {
    return await prisma.video.delete({
      where: { id },
    });
  }

  public async incrementViews(id: string): Promise<void> {
    await prisma.video.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  public async list(params: {
    skip: number;
    limit: number;
    search?: string;
    category?: string;
    tag?: string;
    channelId?: string;
    sort?: "latest" | "views" | "popular";
  }) {
    const where: Prisma.VideoWhereInput = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    };

    if (params.channelId) {
      where.channelId = params.channelId;
    }

    if (params.category) {
      where.category = {
        equals: params.category,
        mode: "insensitive",
      };
    }

    if (params.tag) {
      where.tags = {
        has: params.tag,
      };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.VideoOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sort === "views" || params.sort === "popular") {
      orderBy = { views: "desc" };
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return { videos, total };
  }

  public async findTrending(limit = 10) {
    return await prisma.video.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      take: limit,
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async findPopular(limit = 10) {
    return await prisma.video.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      take: limit,
      orderBy: { views: "desc" },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async findRelated(videoId: string, category: string, tags: string[], limit = 8) {
    return await prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: "PUBLISHED",
        visibility: "PUBLIC",
        OR: [
          { category },
          ...(tags.length > 0 ? [{ tags: { hasSome: tags } }] : []),
        ],
      },
      take: limit,
      orderBy: { views: "desc" },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
          },
        },
      },
    });
  }
}
