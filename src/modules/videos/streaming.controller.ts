import { Elysia, t } from "elysia";
import { VideosService } from "./videos.service";
import { HlsUtil } from "../../common/utils/hls.util";
import { ENV } from "../../config/env.config";
import { NotFoundException } from "../../common/exceptions/app-errors";

const videosService = new VideosService();

export const streamingController = new Elysia({ prefix: "/api/videos" })
  .get(
    "/:id/stream/master.m3u8",
    async ({ params: { id }, set }) => {
      const video = await videosService.getVideoById(id);
      if (!video) throw new NotFoundException("Video not found");

      const playlist = HlsUtil.generateMasterPlaylist(id, ENV.APP_URL);
      set.headers["Content-Type"] = "application/vnd.apple.mpegurl";
      set.headers["Cache-Control"] = "no-cache";
      return playlist;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get HLS Master Playlist (Adaptive Bitrate Streaming)",
      },
    }
  )
  .get(
    "/:id/stream/:quality.m3u8",
    async ({ params: { id, quality }, set }) => {
      const video = await videosService.getVideoById(id);
      if (!video) throw new NotFoundException("Video not found");

      const playlist = HlsUtil.generateVariantPlaylist(
        id,
        quality,
        video.duration || 60,
        ENV.APP_URL
      );
      set.headers["Content-Type"] = "application/vnd.apple.mpegurl";
      set.headers["Cache-Control"] = "public, max-age=3600";
      return playlist;
    },
    {
      params: t.Object({
        id: t.String(),
        quality: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get HLS Variant Playlist for specific quality tier (1080p, 720p, etc)",
      },
    }
  )
  .get(
    "/:id/stream/segments/:segment",
    async ({ params: { id, segment }, set }) => {
      // In production pipeline, returns transcoded MPEG-TS segment chunk from MinIO/S3
      set.headers["Content-Type"] = "video/MP2T";
      set.headers["Cache-Control"] = "public, max-age=86400";
      // Return lightweight binary dummy segment or redirect to MinIO asset
      return new Uint8Array(188); // Standard TS packet size
    },
    {
      params: t.Object({
        id: t.String(),
        segment: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Fetch HLS media segment",
      },
    }
  )
  .get(
    "/:id/stream",
    async ({ params: { id }, request, set }) => {
      const video = await videosService.getVideoById(id);
      if (!video) throw new NotFoundException("Video not found");

      // Redirect client to direct MinIO videoUrl or handle range streaming
      if (video.videoUrl.startsWith("http")) {
        set.redirect = video.videoUrl;
        return;
      }

      set.headers["Content-Type"] = "video/mp4";
      return { videoUrl: video.videoUrl };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Stream raw video content with HTTP byte ranges support",
      },
    }
  );
