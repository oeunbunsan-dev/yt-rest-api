import { Elysia, t } from "elysia";
import { CommentsService } from "./comments.service";
import { CreateCommentDto, UpdateCommentDto } from "./dtos/comments.dto";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const commentsService = new CommentsService();

// Controller mounted on video route for nested comments
export const videoCommentsController = new Elysia({ prefix: "/api/videos" })
  .use(authPlugin)
  .post(
    "/:id/comments",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const comment = await commentsService.addComment(user.userId, id, body);
      return ResponseUtil.created(comment, "Comment posted successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: CreateCommentDto,
      detail: {
        tags: ["Comments"],
        summary: "Post a comment or reply to video",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id/comments",
    async ({ params: { id }, query }) => {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const result = await commentsService.getVideoComments(id, page, limit);
      return ResponseUtil.success(result.comments, "Comments retrieved successfully", 200, result.meta);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Comments"],
        summary: "Get comments and replies for a video",
      },
    }
  );

// Controller mounted directly on /api/comments for item-level actions
export const commentsController = new Elysia({ prefix: "/api/comments" })
  .use(authPlugin)
  .put(
    "/:id",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const updated = await commentsService.updateComment(user.userId, user.role, id, body);
      return ResponseUtil.success(updated, "Comment updated successfully");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateCommentDto,
      detail: {
        tags: ["Comments"],
        summary: "Edit existing comment",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await commentsService.deleteComment(user.userId, user.role, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Comments"],
        summary: "Delete comment",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .patch(
    "/:id/pin",
    async ({ currentUser, params: { id }, body }) => {
      const user = requireAuth(currentUser);
      const isPinned = (body as any)?.isPinned ?? true;
      const updated = await commentsService.pinComment(user.userId, user.role, id, isPinned);
      return ResponseUtil.success(updated, isPinned ? "Comment pinned" : "Comment unpinned");
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Optional(t.Object({
        isPinned: t.Optional(t.Boolean()),
      })),
      detail: {
        tags: ["Comments"],
        summary: "Pin or unpin comment (Channel Owner or Admin)",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/:id/like",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await commentsService.reactToComment(user.userId, id, "LIKE");
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Comments"],
        summary: "Like comment",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/:id/dislike",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await commentsService.reactToComment(user.userId, id, "DISLIKE");
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Comments"],
        summary: "Dislike comment",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id/reaction",
    async ({ currentUser, params: { id } }) => {
      const user = requireAuth(currentUser);
      const result = await commentsService.removeCommentReaction(user.userId, id);
      return ResponseUtil.success(result, result.message);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Comments"],
        summary: "Remove reaction from comment",
        security: [{ BearerAuth: [] }],
      },
    }
  );
