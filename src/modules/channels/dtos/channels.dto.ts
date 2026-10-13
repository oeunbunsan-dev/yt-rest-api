import { t } from "elysia";

export const CreateChannelDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 60 }),
  handle: t.String({ minLength: 3, maxLength: 30, pattern: "^[a-zA-Z0-9_]+$" }),
  description: t.Optional(t.String({ maxLength: 1000 })),
  avatar: t.Optional(t.String()),
  banner: t.Optional(t.String()),
});

export const UpdateChannelDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 60 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  avatar: t.Optional(t.String()),
  banner: t.Optional(t.String()),
});
