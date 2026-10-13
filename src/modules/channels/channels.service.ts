import { ChannelsRepository } from "./channels.repository";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { prisma } from "../../database/prisma.service";

export class ChannelsService {
  constructor(private readonly channelsRepo: ChannelsRepository = new ChannelsRepository()) {}

  public async createChannel(
    userId: string,
    dto: {
      name: string;
      handle: string;
      description?: string;
      avatar?: string;
      banner?: string;
    }
  ) {
    const existingUserChannel = await this.channelsRepo.findByUserId(userId);
    if (existingUserChannel) {
      throw new ConflictException("You already have an existing channel");
    }

    const existingHandle = await this.channelsRepo.findByHandle(dto.handle);
    if (existingHandle) {
      throw new ConflictException(`Channel handle '@${dto.handle}' is already taken`);
    }

    const channel = await this.channelsRepo.create({
      user: { connect: { id: userId } },
      name: dto.name,
      handle: dto.handle,
      description: dto.description,
      avatar: dto.avatar,
      banner: dto.banner,
    });

    // Automatically elevate user role to CREATOR if currently USER
    await prisma.user.update({
      where: { id: userId },
      data: { role: "CREATOR" },
    });

    return channel;
  }

  public async getChannelByHandle(handle: string) {
    const channel = await this.channelsRepo.findByHandle(handle);
    if (!channel) {
      throw new NotFoundException(`Channel '@${handle}' not found`);
    }
    return channel;
  }

  public async getChannelById(id: string) {
    const channel = await this.channelsRepo.findById(id);
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }
    return channel;
  }

  public async getMyChannel(userId: string) {
    const channel = await this.channelsRepo.findByUserId(userId);
    if (!channel) {
      throw new NotFoundException("You do not have a channel yet");
    }
    return channel;
  }

  public async updateChannel(
    userId: string,
    channelId: string,
    role: string,
    dto: {
      name?: string;
      description?: string;
      avatar?: string;
      banner?: string;
    }
  ) {
    const channel = await this.channelsRepo.findById(channelId);
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to update this channel");
    }

    return await this.channelsRepo.update(channelId, dto);
  }

  public async deleteChannel(userId: string, channelId: string, role: string) {
    const channel = await this.channelsRepo.findById(channelId);
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to delete this channel");
    }

    await this.channelsRepo.delete(channelId);
    return { message: "Channel deleted successfully" };
  }

  public async getChannelVideos(channelId: string, page = 1, limit = 10) {
    await this.getChannelById(channelId);

    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { videos, total } = await this.channelsRepo.getChannelVideos(channelId, skip, limit);

    return {
      videos,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }
}
