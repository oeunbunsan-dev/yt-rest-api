import { prisma } from "../../database/prisma.service";

export class HistoriesRepository {
  public async upsertHistory(userId: string, videoId: string, watchedDuration: number) {
    return await prisma.videoHistory.upsert({
      where: {
        userId_videoId: { userId, videoId },
      },
      update: {
        watchedDuration,
        watchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        watchedDuration,
        watchedAt: new Date(),
      },
    });
  }

  public async getHistory(userId: string, skip: number, limit: number) {
    const [history, total] = await Promise.all([
      prisma.videoHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { watchedAt: "desc" },
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
      prisma.videoHistory.count({ where: { userId } }),
    ]);

    return { history, total };
  }

  public async deleteHistoryItem(userId: string, idOrVideoId: string) {
    return await prisma.videoHistory.deleteMany({
      where: {
        userId,
        OR: [{ id: idOrVideoId }, { videoId: idOrVideoId }],
      },
    });
  }

  public async clearHistory(userId: string) {
    return await prisma.videoHistory.deleteMany({
      where: { userId },
    });
  }
}
