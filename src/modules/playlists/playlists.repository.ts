import { prisma } from "../../database/prisma.service";
import type { Playlist, Prisma } from "@prisma/client";

export class PlaylistsRepository {
  public async create(data: Prisma.PlaylistCreateInput): Promise<Playlist> {
    return await prisma.playlist.create({
      data,
    });
  }

  public async findById(id: string) {
    return await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        videos: {
          orderBy: { position: "asc" },
          include: {
            video: {
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
            },
          },
        },
      },
    });
  }

  public async update(id: string, data: Prisma.PlaylistUpdateInput): Promise<Playlist> {
    return await prisma.playlist.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<Playlist> {
    return await prisma.playlist.delete({
      where: { id },
    });
  }

  public async listPublic(skip: number, limit: number) {
    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: { visibility: "PUBLIC" },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
            },
          },
        },
      }),
      prisma.playlist.count({
        where: { visibility: "PUBLIC" },
      }),
    ]);

    return { playlists, total };
  }

  public async listByUser(userId: string, skip: number, limit: number) {
    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: {
              videos: true,
            },
          },
        },
      }),
      prisma.playlist.count({
        where: { userId },
      }),
    ]);

    return { playlists, total };
  }

  public async addVideo(playlistId: string, videoId: string, position: number) {
    return await prisma.playlistVideo.upsert({
      where: {
        playlistId_videoId: { playlistId, videoId },
      },
      update: { position },
      create: { playlistId, videoId, position },
    });
  }

  public async removeVideo(playlistId: string, videoId: string) {
    return await prisma.playlistVideo.delete({
      where: {
        playlistId_videoId: { playlistId, videoId },
      },
    });
  }
}
