import { prisma } from "../../database/prisma.service";
import type { Comment, Prisma, ReactionType } from "@prisma/client";

export class CommentsRepository {
  public async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return await prisma.comment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async findById(id: string) {
    return await prisma.comment.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            id: true,
            channelId: true,
            channel: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });
  }

  public async update(id: string, content: string): Promise<Comment> {
    return await prisma.comment.update({
      where: { id },
      data: { content },
    });
  }

  public async delete(id: string): Promise<Comment> {
    return await prisma.comment.delete({
      where: { id },
    });
  }

  public async findByVideoId(videoId: string, skip: number, limit: number) {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          videoId,
          parentId: null, // Top-level comments
        },
        skip,
        take: limit,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            take: 3,
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              reactions: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: { videoId, parentId: null },
      }),
    ]);

    return { comments, total };
  }

  public async setPinStatus(id: string, isPinned: boolean): Promise<Comment> {
    return await prisma.comment.update({
      where: { id },
      data: { isPinned },
    });
  }

  public async upsertReaction(commentId: string, userId: string, type: ReactionType) {
    return await prisma.commentReaction.upsert({
      where: {
        commentId_userId: { commentId, userId },
      },
      update: { type },
      create: { commentId, userId, type },
    });
  }

  public async removeReaction(commentId: string, userId: string) {
    return await prisma.commentReaction.deleteMany({
      where: { commentId, userId },
    });
  }
}
