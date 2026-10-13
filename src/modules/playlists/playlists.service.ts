import { PlaylistsRepository } from "./playlists.repository";
import { VideosRepository } from "../videos/videos.repository";
import {
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";
import type { PlaylistVisibility } from "@prisma/client";

export class PlaylistsService {
  constructor(
    private readonly playlistsRepo: PlaylistsRepository = new PlaylistsRepository(),
    private readonly videosRepo: VideosRepository = new VideosRepository()
  ) {}

  public async createPlaylist(
    userId: string,
    dto: {
      title: string;
      description?: string;
      visibility?: PlaylistVisibility;
    }
  ) {
    return await this.playlistsRepo.create({
      user: { connect: { id: userId } },
      title: dto.title,
      description: dto.description || "",
      visibility: dto.visibility || "PUBLIC",
    });
  }

  public async getPlaylistById(id: string, currentUserId?: string) {
    const playlist = await this.playlistsRepo.findById(id);
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    if (playlist.visibility === "PRIVATE" && playlist.userId !== currentUserId) {
      throw new ForbiddenException("This playlist is private");
    }

    return playlist;
  }

  public async updatePlaylist(
    userId: string,
    role: string,
    id: string,
    dto: {
      title?: string;
      description?: string;
      visibility?: PlaylistVisibility;
    }
  ) {
    const playlist = await this.playlistsRepo.findById(id);
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    if (playlist.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to modify this playlist");
    }

    return await this.playlistsRepo.update(id, dto);
  }

  public async deletePlaylist(userId: string, role: string, id: string) {
    const playlist = await this.playlistsRepo.findById(id);
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    if (playlist.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to delete this playlist");
    }

    await this.playlistsRepo.delete(id);
    return { message: "Playlist deleted successfully" };
  }

  public async listPlaylists(page = 1, limit = 10, userId?: string) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });

    if (userId) {
      const { playlists, total } = await this.playlistsRepo.listByUser(userId, skip, limit);
      return {
        playlists,
        meta: PaginationUtil.buildMeta(total, page, limit),
      };
    }

    const { playlists, total } = await this.playlistsRepo.listPublic(skip, limit);
    return {
      playlists,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }

  public async addVideoToPlaylist(userId: string, role: string, playlistId: string, videoId: string) {
    const playlist = await this.playlistsRepo.findById(playlistId);
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    if (playlist.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to modify this playlist");
    }

    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const position = playlist.videos.length;
    await this.playlistsRepo.addVideo(playlistId, videoId, position);

    return { message: "Video added to playlist successfully" };
  }

  public async removeVideoFromPlaylist(userId: string, role: string, playlistId: string, videoId: string) {
    const playlist = await this.playlistsRepo.findById(playlistId);
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    if (playlist.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to modify this playlist");
    }

    await this.playlistsRepo.removeVideo(playlistId, videoId);
    return { message: "Video removed from playlist successfully" };
  }
}
