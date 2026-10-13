import { UsersRepository } from "./users.repository";
import { ConflictException, NotFoundException } from "../../common/exceptions/app-errors";

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository = new UsersRepository()) {}

  public async getProfile(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { password: _, ...profile } = user;
    return profile;
  }

  public async updateProfile(
    userId: string,
    dto: {
      username?: string;
      email?: string;
      avatar?: string;
      coverImage?: string;
    }
  ) {
    if (dto.email) {
      const existing = await this.usersRepo.findByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException("Email is already used by another account");
      }
    }

    if (dto.username) {
      const existing = await this.usersRepo.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new ConflictException("Username is already taken");
      }
    }

    const updated = await this.usersRepo.update(userId, {
      ...(dto.username && { username: dto.username }),
      ...(dto.email && { email: dto.email.toLowerCase() }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
    });

    const { password: _, ...profile } = updated;
    return profile;
  }

  public async updateAvatar(userId: string, avatarUrl: string) {
    return this.updateProfile(userId, { avatar: avatarUrl });
  }

  public async updateCover(userId: string, coverImageUrl: string) {
    return this.updateProfile(userId, { coverImage: coverImageUrl });
  }
}
