import { prisma } from "../../database/prisma.service";
import { ChannelsRepository } from "../channels/channels.repository";
import { NotFoundException } from "../../common/exceptions/app-errors";

export class AnalyticsService {
  constructor(private readonly channelsRepo: ChannelsRepository = new ChannelsRepository()) {}

  public async getCreatorDashboard(userId: string) {
    const channel = await this.channelsRepo.findByUserId(userId);
    if (!channel) {
      throw new NotFoundException("Channel not found. Please create a channel to view analytics.");
    }

    const [videos, topVideos, totalViewsAgg, watchHistoryAgg] = await Promise.all([
      prisma.video.findMany({
        where: { channelId: channel.id },
        select: {
          id: true,
          title: true,
          views: true,
          duration: true,
          createdAt: true,
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
      prisma.video.findMany({
        where: { channelId: channel.id },
        take: 5,
        orderBy: { views: "desc" },
        include: {
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
      prisma.video.aggregate({
        where: { channelId: channel.id },
        _sum: {
          views: true,
        },
      }),
      prisma.videoHistory.aggregate({
        where: {
          video: { channelId: channel.id },
        },
        _sum: {
          watchedDuration: true,
        },
      }),
    ]);

    const totalViews = Number(totalViewsAgg._sum.views || 0);
    const watchedSeconds = watchHistoryAgg._sum.watchedDuration || 0;
    const watchHours = parseFloat((watchedSeconds / 3600).toFixed(2));

    // YouTube partner criteria: 1,000 subscribers and 4,000 watch hours
    const isRevenueReady = channel.subscribersCount >= 1000 && watchHours >= 4000;

    return {
      channel: {
        id: channel.id,
        name: channel.name,
        handle: channel.handle,
        subscribersCount: channel.subscribersCount,
      },
      metrics: {
        totalVideos: videos.length,
        totalViews,
        totalSubscribers: channel.subscribersCount,
        watchHours,
        isRevenueReady,
        monetizationProgress: {
          subscribersGoal: 1000,
          currentSubscribers: channel.subscribersCount,
          subscribersPercentage: Math.min(100, Math.round((channel.subscribersCount / 1000) * 100)),
          watchHoursGoal: 4000,
          currentWatchHours: watchHours,
          watchHoursPercentage: Math.min(100, Math.round((watchHours / 4000) * 100)),
        },
      },
      topVideos: topVideos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        views: Number(v.views),
        likesCount: v._count.likes,
        commentsCount: v._count.comments,
        createdAt: v.createdAt,
      })),
    };
  }

  public async getAdminDashboard() {
    const [
      totalUsers,
      totalChannels,
      totalVideos,
      totalViewsAgg,
      totalUploadSessions,
      storageUsageAgg,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.channel.count(),
      prisma.video.count(),
      prisma.video.aggregate({
        _sum: { views: true },
      }),
      prisma.chunkUploadSession.count(),
      prisma.chunkUploadSession.aggregate({
        _sum: { fileSize: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const totalViews = Number(totalViewsAgg._sum.views || 0);
    const totalStorageBytes = Number(storageUsageAgg._sum.fileSize || 0);
    const storageUsageMB = parseFloat((totalStorageBytes / (1024 * 1024)).toFixed(2));

    return {
      overview: {
        totalUsers,
        totalChannels,
        totalVideos,
        totalViews,
        totalUploadSessions,
        storageUsageMB,
        storageUsageBytes: totalStorageBytes,
      },
      recentUsers,
      systemStatus: {
        apiStatus: "HEALTHY",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
