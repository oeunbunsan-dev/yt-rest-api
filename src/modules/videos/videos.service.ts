import { VideosRepository } from "./videos.repository";
import { ChannelsRepository } from "../channels/channels.repository";
import { RedisService } from "../../database/redis.service";
import { ENV } from "../../config/env.config";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { HlsUtil } from "../../common/utils/hls.util";
import type { VideoStatus, VideoVisibility } from "@prisma/client";

export class VideosService {
  constructor(
    private readonly videosRepo: VideosRepository = new VideosRepository(),
    private readonly channelsRepo: ChannelsRepository = new ChannelsRepository()
  ) {}

  public async createVideo(
    userId: string,
    dto: {
      title: string;
      description?: string;
      thumbnail?: string;
      videoUrl: string;
      duration?: number;
      visibility?: VideoVisibility;
      status?: VideoStatus;
      category?: string;
      tags?: string[];
      scheduledPublishAt?: string;
    }
  ) {
    const channel = await this.channelsRepo.findByUserId(userId);
    if (!channel) {
      throw new BadRequestException("You must create a channel before publishing videos");
    }

    const scheduledDate = dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : null;
    let initialStatus: VideoStatus = dto.status || "PUBLISHED";
    if (scheduledDate && scheduledDate > new Date()) {
      initialStatus = "DRAFT";
    }

    const video = await this.videosRepo.create({
      channel: { connect: { id: channel.id } },
      title: dto.title,
      description: dto.description || "",
      thumbnail: dto.thumbnail || "",
      videoUrl: dto.videoUrl,
      duration: dto.duration || 0,
      visibility: dto.visibility || "PUBLIC",
      status: initialStatus,
      category: dto.category || "General",
      tags: dto.tags || [],
      scheduledPublishAt: scheduledDate,
      hlsMasterUrl: `${ENV.APP_URL}/api/videos/STREAM_PLACEHOLDER/stream/master.m3u8`,
    });

    // Update real hls master URL with the newly generated video id
    const hlsUrl = `${ENV.APP_URL}/api/videos/${video.id}/stream/master.m3u8`;
    const updated = await this.videosRepo.update(video.id, {
      hlsMasterUrl: hlsUrl,
    });

    // Invalidate trending/popular cache
    await RedisService.del("cache:videos:trending");
    await RedisService.del("cache:videos:popular");

    return updated;
  }

  public async getVideoById(id: string, currentUserId?: string) {
    const video = await this.videosRepo.findByIdWithDetails(id, currentUserId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    // Access control for non-public videos
    if (video.visibility === "PRIVATE" && (!currentUserId || video.channel.userId !== currentUserId)) {
      throw new ForbiddenException("This video is private");
    }

    // Increment view asynchronously
    this.videosRepo.incrementViews(id).catch((err) => console.warn("Failed to increment views:", err));

    return video;
  }

  public async updateVideo(
    userId: string,
    role: string,
    videoId: string,
    dto: {
      title?: string;
      description?: string;
      thumbnail?: string;
      visibility?: VideoVisibility;
      status?: VideoStatus;
      category?: string;
      tags?: string[];
      scheduledPublishAt?: string;
    }
  ) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    if (video.channel.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to modify this video");
    }

    const scheduledDate = dto.scheduledPublishAt !== undefined
      ? (dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : null)
      : undefined;

    const updated = await this.videosRepo.update(videoId, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
      ...(dto.visibility && { visibility: dto.visibility }),
      ...(dto.status && { status: dto.status }),
      ...(dto.category && { category: dto.category }),
      ...(dto.tags && { tags: dto.tags }),
      ...(scheduledDate !== undefined && { scheduledPublishAt: scheduledDate }),
    });

    await RedisService.del("cache:videos:trending");
    await RedisService.del("cache:videos:popular");

    return updated;
  }

  public async deleteVideo(userId: string, role: string, videoId: string) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    if (video.channel.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to delete this video");
    }

    await this.videosRepo.delete(videoId);

    await RedisService.del("cache:videos:trending");
    await RedisService.del("cache:videos:popular");

    return { message: "Video deleted successfully" };
  }

  public async listVideos(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    channelId?: string;
    sort?: "latest" | "views" | "popular";
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const { skip } = PaginationUtil.parsePagination({ page, limit });

    const { videos, total } = await this.videosRepo.list({
      skip,
      limit,
      search: params.search,
      category: params.category,
      tag: params.tag,
      channelId: params.channelId,
      sort: params.sort,
    });

    return {
      videos,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }

  public async getTrendingVideos(limit = 10) {
    const cacheKey = `cache:videos:trending:${limit}`;
    return await RedisService.cacheAside(cacheKey, 60, async () => {
      return await this.videosRepo.findTrending(limit);
    });
  }

  public async getPopularVideos(limit = 10) {
    const cacheKey = `cache:videos:popular:${limit}`;
    return await RedisService.cacheAside(cacheKey, 120, async () => {
      return await this.videosRepo.findPopular(limit);
    });
  }

  public async getRecommendations(currentUserId?: string, limit = 10) {
    // Return high performing videos or personalized list
    return await this.getPopularVideos(limit);
  }

  public async getRelatedVideos(videoId: string, limit = 8) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    return await this.videosRepo.findRelated(videoId, video.category, video.tags, limit);
  }

  public async recordView(videoId: string) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }
    await this.videosRepo.incrementViews(videoId);
    return { message: "View recorded" };
  }
}
