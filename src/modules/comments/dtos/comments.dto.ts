import { t } from "elysia";

export const CreateCommentDto = t.Object({
  content: t.String({ minLength: 1, maxLength: 2000 }),
  parentId: t.Optional(t.String()),
});

export const UpdateCommentDto = t.Object({
  content: t.String({ minLength: 1, maxLength: 2000 }),
});

export const CommentReactionDto = t.Object({
  type: t.Union([t.Literal("LIKE"), t.Literal("DISLIKE")]),
});
