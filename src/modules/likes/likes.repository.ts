import { prisma } from "../../database/prisma.service";

export class LikesRepository {
  public async findLike(userId: string, videoId: string) {
    return await prisma.like.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });
  }

  public async createLike(userId: string, videoId: string) {
    return await prisma.like.create({
      data: { userId, videoId },
    });
  }

  public async deleteLike(userId: string, videoId: string) {
    return await prisma.like.delete({
      where: {
        userId_videoId: { userId, videoId },
      },
    });
  }

  public async getLikedVideos(userId: string, skip: number, limit: number) {
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.like.count({ where: { userId } }),
    ]);

    return { likes, total };
  }
}
