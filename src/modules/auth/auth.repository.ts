import { prisma } from "../../database/prisma.service";
import type { Prisma, User, RefreshToken, VerificationToken, PasswordResetToken } from "@prisma/client";

export class AuthRepository {
  public async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { channel: true },
    });
  }

  public async findByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  public async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { channel: true },
    });
  }

  public async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
      include: { channel: true },
    });
  }

  public async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null> {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  public async createVerificationToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken> {
    return await prisma.verificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  public async findVerificationToken(token: string): Promise<VerificationToken | null> {
    return await prisma.verificationToken.findUnique({
      where: { token },
    });
  }

  public async deleteVerificationToken(id: string): Promise<void> {
    await prisma.verificationToken.delete({
      where: { id },
    });
  }

  public async markUserVerified(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });
  }

  public async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    return await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  public async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    return await prisma.passwordResetToken.findUnique({
      where: { token },
    });
  }

  public async markPasswordResetTokenUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  public async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }
}
