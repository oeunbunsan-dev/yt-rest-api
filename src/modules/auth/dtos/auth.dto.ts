import { t } from "elysia";

export const RegisterDto = t.Object({
  username: t.String({ minLength: 3, maxLength: 30 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6, maxLength: 100 }),
  role: t.Optional(t.Union([t.Literal("USER"), t.Literal("CREATOR"), t.Literal("ADMIN")])),
});

export const LoginDto = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const RefreshTokenDto = t.Object({
  refreshToken: t.String(),
});

export const VerifyEmailDto = t.Object({
  token: t.String(),
});

export const ForgotPasswordDto = t.Object({
  email: t.String({ format: "email" }),
});

export const ResetPasswordDto = t.Object({
  token: t.String(),
  newPassword: t.String({ minLength: 6, maxLength: 100 }),
});
