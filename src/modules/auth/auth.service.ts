import { AuthRepository } from "./auth.repository";
import { PasswordUtil } from "../../common/utils/password.util";
import { JwtUtil } from "../../common/utils/jwt.util";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/exceptions/app-errors";
import crypto from "crypto";

export class AuthService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  public async register(dto: {
    username: string;
    email: string;
    password: string;
    role?: "USER" | "CREATOR" | "ADMIN";
  }) {
    const existingEmail = await this.authRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException("An account with this email address already exists");
    }

    const existingUsername = await this.authRepo.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException("Username is already taken");
    }

    const hashedPassword = await PasswordUtil.hash(dto.password);
    const assignedRole = dto.role || "USER";

    const user = await this.authRepo.createUser({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: assignedRole,
      verified: false,
    });

    // Create verification token (valid for 24 hours)
    const verificationTokenString = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.authRepo.createVerificationToken(user.id, verificationTokenString, verificationExpiresAt);

    // Generate JWT tokens
    const accessToken = JwtUtil.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.createRefreshToken(user.id, refreshTokenString, refreshExpiresAt);

    const { password: _, ...userProfile } = user;

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
      },
      verificationToken: verificationTokenString,
    };
  }

  public async login(dto: { email: string; password: string }) {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await PasswordUtil.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = JwtUtil.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.createRefreshToken(user.id, refreshTokenString, refreshExpiresAt);

    const { password: _, ...userProfile } = user;

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
      },
    };
  }

  public async refreshToken(dto: { refreshToken: string }) {
    const storedToken = await this.authRepo.findRefreshToken(dto.refreshToken);

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException("Refresh token is invalid, expired, or revoked");
    }

    // Revoke current refresh token to enforce token rotation
    await this.authRepo.revokeRefreshToken(dto.refreshToken);

    const user = storedToken.user;
    const newAccessToken = JwtUtil.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshTokenString = crypto.randomBytes(40).toString("hex");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.createRefreshToken(user.id, newRefreshTokenString, refreshExpiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString,
    };
  }

  public async logout(dto: { refreshToken: string }) {
    await this.authRepo.revokeRefreshToken(dto.refreshToken);
    return { message: "Logged out successfully" };
  }

  public async verifyEmail(token: string) {
    const record = await this.authRepo.findVerificationToken(token);
    if (!record) {
      throw new BadRequestException("Invalid email verification token");
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException("Email verification token has expired");
    }

    await this.authRepo.markUserVerified(record.userId);
    await this.authRepo.deleteVerificationToken(record.id);

    return { message: "Email successfully verified" };
  }

  public async forgotPassword(email: string) {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      // Do not disclose whether email exists
      return { message: "If an account exists with this email, a password reset link has been dispatched." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.authRepo.createPasswordResetToken(user.id, resetToken, expiresAt);

    return {
      message: "If an account exists with this email, a password reset link has been dispatched.",
      resetToken, // Provided for direct API consumption / testing
    };
  }

  public async resetPassword(token: string, newPassword: string) {
    const record = await this.authRepo.findPasswordResetToken(token);
    if (!record || record.used || new Date() > record.expiresAt) {
      throw new BadRequestException("Password reset token is invalid, used, or expired");
    }

    const hashed = await PasswordUtil.hash(newPassword);
    await this.authRepo.updateUserPassword(record.userId, hashed);
    await this.authRepo.markPasswordResetTokenUsed(record.id);

    return { message: "Password has been successfully reset" };
  }
}
