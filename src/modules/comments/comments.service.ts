import { CommentsRepository } from "./comments.repository";
import { VideosRepository } from "../videos/videos.repository";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";
import { prisma } from "../../database/prisma.service";
import type { ReactionType } from "@prisma/client";

export class CommentsService {
  constructor(
    private readonly commentsRepo: CommentsRepository = new CommentsRepository(),
    private readonly videosRepo: VideosRepository = new VideosRepository()
  ) {}

  public async addComment(
    userId: string,
    videoId: string,
    dto: { content: string; parentId?: string }
  ) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    if (dto.parentId) {
      const parent = await this.commentsRepo.findById(dto.parentId);
      if (!parent || parent.videoId !== videoId) {
        throw new BadRequestException("Invalid parent comment for this video");
      }
    }

    const comment = await this.commentsRepo.create({
      video: { connect: { id: videoId } },
      user: { connect: { id: userId } },
      content: dto.content,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
    });

    // Notify video owner (if different from comment author)
    if (video.channel.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: video.channel.userId,
          title: "New Comment",
          content: `Someone commented on your video: "${video.title}"`,
          type: "NEW_COMMENT",
          data: { videoId, commentId: comment.id },
        },
      }).catch(() => {});
    }

    return comment;
  }

  public async updateComment(
    userId: string,
    role: string,
    commentId: string,
    dto: { content: string }
  ) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You can only edit your own comments");
    }

    return await this.commentsRepo.update(commentId, dto.content);
  }

  public async deleteComment(userId: string, role: string, commentId: string) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const isVideoOwner = comment.video.channel.userId === userId;
    const isCommentAuthor = comment.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isCommentAuthor && !isVideoOwner && !isAdmin) {
      throw new ForbiddenException("You do not have permission to delete this comment");
    }

    await this.commentsRepo.delete(commentId);
    return { message: "Comment deleted successfully" };
  }

  public async pinComment(userId: string, role: string, commentId: string, isPinned = true) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const isVideoOwner = comment.video.channel.userId === userId;
    if (!isVideoOwner && role !== "ADMIN") {
      throw new ForbiddenException("Only the video owner can pin comments");
    }

    return await this.commentsRepo.setPinStatus(commentId, isPinned);
  }

  public async reactToComment(userId: string, commentId: string, type: ReactionType) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    await this.commentsRepo.upsertReaction(commentId, userId, type);
    return { message: `Comment reaction updated to ${type}` };
  }

  public async removeCommentReaction(userId: string, commentId: string) {
    await this.commentsRepo.removeReaction(commentId, userId);
    return { message: "Comment reaction removed" };
  }

  public async getVideoComments(videoId: string, page = 1, limit = 20) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { comments, total } = await this.commentsRepo.findByVideoId(videoId, skip, limit);

    return {
      comments,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }
}
