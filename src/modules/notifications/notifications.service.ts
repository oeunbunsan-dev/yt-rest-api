import { NotificationsRepository } from "./notifications.repository";
import { PaginationUtil } from "../../common/utils/pagination.util";

export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository = new NotificationsRepository()) {}

  public async getNotifications(userId: string, page = 1, limit = 20) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { notifications, total, unreadCount } = await this.notificationsRepo.getNotifications(
      userId,
      skip,
      limit
    );

    return {
      notifications,
      unreadCount,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }

  public async markAsRead(userId: string, id: string) {
    await this.notificationsRepo.markAsRead(id, userId);
    return { message: "Notification marked as read" };
  }

  public async markAllAsRead(userId: string) {
    await this.notificationsRepo.markAllAsRead(userId);
    return { message: "All notifications marked as read" };
  }
}
