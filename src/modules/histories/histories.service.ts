import { HistoriesRepository } from "./histories.repository";
import { VideosRepository } from "../videos/videos.repository";
import { NotFoundException } from "../../common/exceptions/app-errors";
import { PaginationUtil } from "../../common/utils/pagination.util";

export class HistoriesService {
  constructor(
    private readonly historiesRepo: HistoriesRepository = new HistoriesRepository(),
    private readonly videosRepo: VideosRepository = new VideosRepository()
  ) {}

  public async recordHistory(userId: string, videoId: string, watchedDuration = 0) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const item = await this.historiesRepo.upsertHistory(userId, videoId, watchedDuration);
    return item;
  }

  public async getHistory(userId: string, page = 1, limit = 20) {
    const { skip } = PaginationUtil.parsePagination({ page, limit });
    const { history, total } = await this.historiesRepo.getHistory(userId, skip, limit);

    return {
      history,
      meta: PaginationUtil.buildMeta(total, page, limit),
    };
  }

  public async removeHistoryItem(userId: string, idOrVideoId: string) {
    await this.historiesRepo.deleteHistoryItem(userId, idOrVideoId);
    return { message: "Watch history item removed" };
  }

  public async clearHistory(userId: string) {
    await this.historiesRepo.clearHistory(userId);
    return { message: "Watch history cleared successfully" };
  }
}
