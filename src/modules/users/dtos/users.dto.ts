import { t } from "elysia";

export const UpdateProfileDto = t.Object({
  username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
  email: t.Optional(t.String({ format: "email" })),
  avatar: t.Optional(t.String()),
  coverImage: t.Optional(t.String()),
});

export const UpdateAvatarDto = t.Object({
  avatarUrl: t.String(),
});

export const UpdateCoverDto = t.Object({
  coverImageUrl: t.String(),
});
