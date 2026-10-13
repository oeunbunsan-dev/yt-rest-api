import { SubscriptionsRepository } from "./subscriptions.repository";
import { ChannelsRepository } from "../channels/channels.repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { prisma } from "../../database/prisma.service";

export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository = new SubscriptionsRepository(),
    private readonly channelsRepo: ChannelsRepository = new ChannelsRepository()
  ) {}

  public async subscribe(subscriberId: string, channelId: string) {
    const channel = await this.channelsRepo.findById(channelId);
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.userId === subscriberId) {
      throw new BadRequestException("You cannot subscribe to your own channel");
    }

    const existing = await this.subscriptionsRepo.findSubscription(subscriberId, channelId);
    if (existing) {
      throw new ConflictException("You are already subscribed to this channel");
    }

    const sub = await this.subscriptionsRepo.createSubscription(subscriberId, channelId);

    // Notify channel creator
    const subscriber = await prisma.user.findUnique({
      where: { id: subscriberId },
      select: { username: true },
    });

    await prisma.notification.create({
      data: {
        userId: channel.userId,
        title: "New Subscriber",
        content: `${subscriber?.username || "Someone"} subscribed to your channel!`,
        type: "NEW_SUBSCRIBER",
        data: { channelId, subscriberId },
      },
    }).catch(() => {});

    return {
      message: "Subscribed to channel successfully",
      subscription: sub,
    };
  }

  public async unsubscribe(subscriberId: string, channelId: string) {
    const existing = await this.subscriptionsRepo.findSubscription(subscriberId, channelId);
    if (!existing) {
      throw new NotFoundException("You are not subscribed to this channel");
    }

    await this.subscriptionsRepo.deleteSubscription(subscriberId, channelId);
    return { message: "Unsubscribed from channel successfully" };
  }

  public async getSubscribedChannels(subscriberId: string, page = 1, limit = 20) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { subscriptions, total } = await this.subscriptionsRepo.getSubscribedChannels(subscriberId, skip, limit);

    return {
      subscriptions,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }

  public async getSubscriberCount(channelId: string) {
    const count = await this.subscriptionsRepo.getSubscriberCount(channelId);
    return { channelId, subscriberCount: count };
  }
}
