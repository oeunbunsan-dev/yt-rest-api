import { LikesRepository } from "./likes.repository";
import { VideosRepository } from "../videos/videos.repository";
import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";

export class LikesService {
  constructor(
    private readonly likesRepo: LikesRepository = new LikesRepository(),
    private readonly videosRepo: VideosRepository = new VideosRepository()
  ) {}

  public async likeVideo(userId: string, videoId: string) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const existing = await this.likesRepo.findLike(userId, videoId);
    if (existing) {
      throw new ConflictException("You have already liked this video");
    }

    await this.likesRepo.createLike(userId, videoId);
    return { message: "Video liked successfully" };
  }

  public async unlikeVideo(userId: string, videoId: string) {
    const existing = await this.likesRepo.findLike(userId, videoId);
    if (!existing) {
      throw new NotFoundException("You have not liked this video");
    }

    await this.likesRepo.deleteLike(userId, videoId);
    return { message: "Video like removed successfully" };
  }

  public async getLikedVideos(userId: string, page = 1, limit = 20) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { likes, total } = await this.likesRepo.getLikedVideos(userId, skip, limit);

    return {
      videos: likes.map((l) => l.video),
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }
}
