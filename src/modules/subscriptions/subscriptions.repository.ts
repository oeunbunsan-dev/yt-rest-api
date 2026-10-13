import { prisma } from "../../database/prisma.service";

export class SubscriptionsRepository {
  public async findSubscription(subscriberId: string, channelId: string) {
    return await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId, channelId },
      },
    });
  }

  public async createSubscription(subscriberId: string, channelId: string) {
    return await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: { subscriberId, channelId },
      });

      await tx.channel.update({
        where: { id: channelId },
        data: { subscribersCount: { increment: 1 } },
      });

      return sub;
    });
  }

  public async deleteSubscription(subscriberId: string, channelId: string) {
    return await prisma.$transaction(async (tx) => {
      const deleted = await tx.subscription.delete({
        where: {
          subscriberId_channelId: { subscriberId, channelId },
        },
      });

      await tx.channel.update({
        where: { id: channelId },
        data: { subscribersCount: { decrement: 1 } },
      });

      return deleted;
    });
  }

  public async getSubscribedChannels(subscriberId: string, skip: number, limit: number) {
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { subscriberId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          channel: {
            include: {
              _count: {
                select: { videos: true },
              },
            },
          },
        },
      }),
      prisma.subscription.count({
        where: { subscriberId },
      }),
    ]);

    return { subscriptions, total };
  }

  public async getSubscriberCount(channelId: string): Promise<number> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { subscribersCount: true },
    });
    return channel?.subscribersCount || 0;
  }
}
