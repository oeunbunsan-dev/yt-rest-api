import { Elysia } from "elysia";
import { UsersService } from "./users.service";
import { UpdateProfileDto, UpdateAvatarDto, UpdateCoverDto } from "./dtos/users.dto";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";

const usersService = new UsersService();

export const usersController = new Elysia({ prefix: "/api/users" })
  .use(authPlugin)
  .get(
    "/me",
    async ({ currentUser }) => {
      const user = requireAuth(currentUser);
      const profile = await usersService.getProfile(user.userId);
      return ResponseUtil.success(profile, "Profile retrieved successfully");
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get current authenticated user profile",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/profile",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const updated = await usersService.updateProfile(user.userId, body);
      return ResponseUtil.success(updated, "Profile updated successfully");
    },
    {
      body: UpdateProfileDto,
      detail: {
        tags: ["Users"],
        summary: "Update user profile details",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/avatar",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const updated = await usersService.updateAvatar(user.userId, body.avatarUrl);
      return ResponseUtil.success(updated, "Avatar updated successfully");
    },
    {
      body: UpdateAvatarDto,
      detail: {
        tags: ["Users"],
        summary: "Update user profile avatar image",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/cover",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const updated = await usersService.updateCover(user.userId, body.coverImageUrl);
      return ResponseUtil.success(updated, "Cover image updated successfully");
    },
    {
      body: UpdateCoverDto,
      detail: {
        tags: ["Users"],
        summary: "Update user profile cover image",
        security: [{ BearerAuth: [] }],
      },
    }
  );
