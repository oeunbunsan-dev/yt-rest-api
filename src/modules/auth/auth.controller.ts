import { Elysia } from "elysia";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dtos/auth.dto";
import { ResponseUtil } from "../../common/utils/response.util";
import { AuditService } from "../../common/middleware/audit.middleware";

const authService = new AuthService();

export const authController = new Elysia({ prefix: "/api/auth" })
  .post(
    "/register",
    async ({ body, request }) => {
      const result = await authService.register(body);
      await AuditService.log({
        userId: result.user.id,
        action: "USER_REGISTER",
        resource: "AUTH",
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      });
      return ResponseUtil.created(result, "User registered successfully");
    },
    {
      body: RegisterDto,
      detail: {
        tags: ["Auth"],
        summary: "Register new user account",
      },
    }
  )
  .post(
    "/login",
    async ({ body, request }) => {
      const result = await authService.login(body);
      await AuditService.log({
        userId: result.user.id,
        action: "USER_LOGIN",
        resource: "AUTH",
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      });
      return ResponseUtil.success(result, "Logged in successfully");
    },
    {
      body: LoginDto,
      detail: {
        tags: ["Auth"],
        summary: "Login with email and password",
      },
    }
  )
  .post(
    "/refresh",
    async ({ body }) => {
      const result = await authService.refreshToken(body);
      return ResponseUtil.success(result, "Tokens refreshed successfully");
    },
    {
      body: RefreshTokenDto,
      detail: {
        tags: ["Auth"],
        summary: "Rotate and refresh JWT access token",
      },
    }
  )
  .post(
    "/logout",
    async ({ body }) => {
      const result = await authService.logout(body);
      return ResponseUtil.success(result, result.message);
    },
    {
      body: RefreshTokenDto,
      detail: {
        tags: ["Auth"],
        summary: "Revoke refresh token and logout",
      },
    }
  )
  .post(
    "/verify-email",
    async ({ body }) => {
      const result = await authService.verifyEmail(body.token);
      return ResponseUtil.success(result, result.message);
    },
    {
      body: VerifyEmailDto,
      detail: {
        tags: ["Auth"],
        summary: "Verify user email address using token",
      },
    }
  )
  .post(
    "/forgot-password",
    async ({ body }) => {
      const result = await authService.forgotPassword(body.email);
      return ResponseUtil.success(result, result.message);
    },
    {
      body: ForgotPasswordDto,
      detail: {
        tags: ["Auth"],
        summary: "Initiate password reset request",
      },
    }
  )
  .post(
    "/reset-password",
    async ({ body }) => {
      const result = await authService.resetPassword(body.token, body.newPassword);
      return ResponseUtil.success(result, result.message);
    },
    {
      body: ResetPasswordDto,
      detail: {
        tags: ["Auth"],
        summary: "Reset user password with valid reset token",
      },
    }
  );
