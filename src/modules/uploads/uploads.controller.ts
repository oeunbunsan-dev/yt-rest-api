import { Elysia, t } from "elysia";
import { UploadsService } from "./uploads.service";
import { authPlugin, requireAuth } from "../../common/middleware/auth.middleware";
import { ResponseUtil } from "../../common/utils/response.util";
import { STORAGE_CONSTANTS } from "../../config/minio.config";
import { BadRequestException } from "../../common/exceptions/app-errors";

export const uploadsController = new Elysia({ prefix: "/api/uploads" })
  .use(authPlugin)
  .post(
    "/presigned-url",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const result = await UploadsService.generatePresignedUrl(
        body.prefix || STORAGE_CONSTANTS.PREFIXES.VIDEOS,
        body.fileName,
        body.contentType
      );
      return ResponseUtil.success(result, "Presigned URL generated");
    },
    {
      body: t.Object({
        fileName: t.String(),
        contentType: t.String(),
        prefix: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Generate presigned upload URL for direct S3/MinIO upload",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/avatar",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const file = body.file as File;
      if (!file) throw new BadRequestException("No file provided");

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await UploadsService.uploadBuffer(
        buffer,
        STORAGE_CONSTANTS.PREFIXES.AVATARS,
        file.name,
        file.type
      );
      return ResponseUtil.created(result, "Avatar uploaded successfully");
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Upload user or channel avatar",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/banner",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const file = body.file as File;
      if (!file) throw new BadRequestException("No file provided");

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await UploadsService.uploadBuffer(
        buffer,
        STORAGE_CONSTANTS.PREFIXES.BANNERS,
        file.name,
        file.type
      );
      return ResponseUtil.created(result, "Banner uploaded successfully");
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Upload channel banner / cover image",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/thumbnail",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const file = body.file as File;
      if (!file) throw new BadRequestException("No file provided");

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await UploadsService.uploadBuffer(
        buffer,
        STORAGE_CONSTANTS.PREFIXES.THUMBNAILS,
        file.name,
        file.type
      );
      return ResponseUtil.created(result, "Thumbnail uploaded successfully");
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Upload video thumbnail",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/video",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const file = body.file as File;
      if (!file) throw new BadRequestException("No file provided");

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await UploadsService.uploadBuffer(
        buffer,
        STORAGE_CONSTANTS.PREFIXES.VIDEOS,
        file.name,
        file.type
      );
      return ResponseUtil.created(result, "Video uploaded successfully");
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Upload raw video file",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/chunks/init",
    async ({ currentUser, body }) => {
      const user = requireAuth(currentUser);
      const result = await UploadsService.initChunkUpload(
        user.userId,
        body.fileName,
        body.fileSize,
        body.totalChunks,
        body.mimeType
      );
      return ResponseUtil.created(result, "Chunk upload session initialized");
    },
    {
      body: t.Object({
        fileName: t.String(),
        fileSize: t.Number(),
        totalChunks: t.Number(),
        mimeType: t.String(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Initialize chunked video upload session",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/chunks/upload",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const file = body.chunk as File;
      if (!file) throw new BadRequestException("No chunk file provided");

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await UploadsService.uploadChunk(
        body.uploadId,
        Number(body.chunkIndex),
        buffer
      );
      return ResponseUtil.success(result, "Chunk uploaded successfully");
    },
    {
      body: t.Object({
        uploadId: t.String(),
        chunkIndex: t.Numeric(),
        chunk: t.File(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Upload a specific video chunk",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/chunks/complete",
    async ({ currentUser, body }) => {
      requireAuth(currentUser);
      const result = await UploadsService.completeChunkUpload(body.uploadId);
      return ResponseUtil.success(result, "Chunk upload verified and marked complete");
    },
    {
      body: t.Object({
        uploadId: t.String(),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Finalize and complete chunked video upload",
        security: [{ BearerAuth: [] }],
      },
    }
  );
