import { t } from "elysia";

export const CreateVideoDto = t.Object({
  title: t.String({ minLength: 3, maxLength: 120 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
  thumbnail: t.Optional(t.String()),
  videoUrl: t.String(),
  duration: t.Optional(t.Number({ minimum: 0 })),
  visibility: t.Optional(t.Union([t.Literal("PUBLIC"), t.Literal("PRIVATE"), t.Literal("UNLISTED")])),
  status: t.Optional(t.Union([t.Literal("DRAFT"), t.Literal("PROCESSING"), t.Literal("PUBLISHED"), t.Literal("PRIVATE"), t.Literal("DELETED")])),
  category: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  scheduledPublishAt: t.Optional(t.String()),
});

export const UpdateVideoDto = t.Object({
  title: t.Optional(t.String({ minLength: 3, maxLength: 120 })),
  description: t.Optional(t.String({ maxLength: 5000 })),
  thumbnail: t.Optional(t.String()),
  visibility: t.Optional(t.Union([t.Literal("PUBLIC"), t.Literal("PRIVATE"), t.Literal("UNLISTED")])),
  status: t.Optional(t.Union([t.Literal("DRAFT"), t.Literal("PROCESSING"), t.Literal("PUBLISHED"), t.Literal("PRIVATE"), t.Literal("DELETED")])),
  category: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  scheduledPublishAt: t.Optional(t.String()),
});

export const VideoQueryDto = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
  search: t.Optional(t.String()),
  category: t.Optional(t.String()),
  tag: t.Optional(t.String()),
  channelId: t.Optional(t.String()),
  sort: t.Optional(t.Union([t.Literal("latest"), t.Literal("views"), t.Literal("popular")])),
});
