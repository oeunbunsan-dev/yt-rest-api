import { t } from "elysia";

export const CreatePlaylistDto = t.Object({
  title: t.String({ minLength: 2, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 1000 })),
  visibility: t.Optional(t.Union([t.Literal("PUBLIC"), t.Literal("PRIVATE"), t.Literal("UNLISTED")])),
});

export const UpdatePlaylistDto = t.Object({
  title: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  visibility: t.Optional(t.Union([t.Literal("PUBLIC"), t.Literal("PRIVATE"), t.Literal("UNLISTED")])),
});

export const AddPlaylistVideoDto = t.Object({
  videoId: t.String(),
});
