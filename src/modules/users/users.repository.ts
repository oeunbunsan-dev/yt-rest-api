import { prisma } from "../../database/prisma.service";
import type { Prisma, User } from "@prisma/client";

export class UsersRepository {
  public async findById(id: string): Promise<(User & { channel: any }) | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        channel: true,
        _count: {
          select: {
            subscriptions: true,
            playlists: true,
            comments: true,
          },
        },
      },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  public async findByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  public async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        channel: true,
      },
    });
  }
}
