import { prisma } from "../../database/prisma.service";
import type { Channel, Prisma } from "@prisma/client";

export class ChannelsRepository {
  public async findById(id: string): Promise<Channel | null> {
    return await prisma.channel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            videos: true,
            subscribers: true,
          },
        },
      },
    });
  }

  public async findByHandle(handle: string): Promise<Channel | null> {
    return await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            videos: true,
            subscribers: true,
          },
        },
      },
    });
  }

  public async findByUserId(userId: string): Promise<Channel | null> {
    return await prisma.channel.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            videos: true,
            subscribers: true,
          },
        },
      },
    });
  }

  public async create(data: Prisma.ChannelCreateInput): Promise<Channel> {
    return await prisma.channel.create({
      data: {
        ...data,
        handle: data.handle.toLowerCase(),
      },
    });
  }

  public async update(id: string, data: Prisma.ChannelUpdateInput): Promise<Channel> {
    return await prisma.channel.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<Channel> {
    return await prisma.channel.delete({
      where: { id },
    });
  }

  public async getChannelVideos(channelId: string, skip: number, limit: number) {
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          channelId,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.video.count({
        where: {
          channelId,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
      }),
    ]);

    return { videos, total };
  }

  public async updateSubscribersCount(channelId: string, delta: number): Promise<void> {
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        subscribersCount: {
          increment: delta,
        },
      },
    });
  }
}
