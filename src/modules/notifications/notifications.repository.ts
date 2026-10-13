import { prisma } from "../../database/prisma.service";

export class NotificationsRepository {
  public async getNotifications(userId: string, skip: number, limit: number) {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  public async markAsRead(id: string, userId: string) {
    return await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  public async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
