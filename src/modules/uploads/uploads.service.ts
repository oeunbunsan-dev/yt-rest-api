import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, STORAGE_CONSTANTS } from "../../config/minio.config";
import { ENV } from "../../config/env.config";
import { prisma } from "../../database/prisma.service";
import { BadRequestException, NotFoundException } from "../../common/exceptions/app-errors";
import crypto from "crypto";

export class UploadsService {
  private static bucketInitialized = false;

  public static async ensureBucketExists(): Promise<void> {
    if (this.bucketInitialized) return;

    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
        })
      );
      this.bucketInitialized = true;
    } catch {
      try {
        console.log(`Bucket ${STORAGE_CONSTANTS.BUCKET_NAME} not found. Creating bucket...`);
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
          })
        );

        // Set public read policy for standard media downloads
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicReadGetObject",
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${STORAGE_CONSTANTS.BUCKET_NAME}/*`],
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
            Policy: JSON.stringify(policy),
          })
        );
        this.bucketInitialized = true;
        console.log(`Bucket ${STORAGE_CONSTANTS.BUCKET_NAME} created and configured.`);
      } catch (err) {
        console.warn("Could not ensure MinIO bucket exists:", err);
      }
    }
  }

  public static getPublicUrl(key: string): string {
    return `${ENV.MINIO_PUBLIC_URL}/${key}`;
  }

  public static async uploadBuffer(
    buffer: Buffer | Uint8Array,
    prefix: string,
    originalFilename: string,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    await this.ensureBucketExists();

    const ext = originalFilename.includes(".") ? originalFilename.split(".").pop() : "bin";
    const uniqueId = crypto.randomUUID();
    const key = `${prefix}/${uniqueId}.${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return {
      key,
      url: this.getPublicUrl(key),
    };
  }

  public static async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
          Key: key,
        })
      );
    } catch (err) {
      console.warn(`Failed to delete S3 object ${key}:`, err);
    }
  }

  public static async generatePresignedUrl(
    prefix: string,
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    await this.ensureBucketExists();

    const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  // Chunk Upload implementation for large video streaming/uploads
  public static async initChunkUpload(
    userId: string,
    fileName: string,
    fileSize: number,
    totalChunks: number,
    mimeType: string
  ): Promise<{ uploadId: string; s3Key: string }> {
    await this.ensureBucketExists();

    const uploadId = crypto.randomUUID();
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "mp4";
    const s3Key = `${STORAGE_CONSTANTS.PREFIXES.VIDEOS}/${uploadId}.${ext}`;

    await prisma.chunkUploadSession.create({
      data: {
        uploadId,
        userId,
        fileName,
        fileSize: BigInt(fileSize),
        totalChunks,
        mimeType,
        s3Key,
        status: "INIT",
      },
    });

    return { uploadId, s3Key };
  }

  public static async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    buffer: Buffer | Uint8Array
  ): Promise<{ message: string; uploadedChunks: number[] }> {
    await this.ensureBucketExists();

    const session = await prisma.chunkUploadSession.findUnique({
      where: { uploadId },
    });

    if (!session) {
      throw new NotFoundException("Upload session not found");
    }

    if (session.status === "COMPLETED" || session.status === "ABORTED") {
      throw new BadRequestException(`Upload session is already ${session.status}`);
    }

    const chunkKey = `${STORAGE_CONSTANTS.PREFIXES.CHUNKS}/${uploadId}/chunk_${chunkIndex}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
        Key: chunkKey,
        Body: buffer,
        ContentType: "application/octet-stream",
      })
    );

    const updatedChunks = Array.from(new Set([...session.uploadedChunks, chunkIndex])).sort((a, b) => a - b);

    await prisma.chunkUploadSession.update({
      where: { uploadId },
      data: {
        uploadedChunks: updatedChunks,
        status: "UPLOADING",
      },
    });

    return {
      message: `Chunk ${chunkIndex} uploaded successfully`,
      uploadedChunks: updatedChunks,
    };
  }

  public static async completeChunkUpload(
    uploadId: string
  ): Promise<{ message: string; s3Key: string; videoUrl: string }> {
    const session = await prisma.chunkUploadSession.findUnique({
      where: { uploadId },
    });

    if (!session) {
      throw new NotFoundException("Upload session not found");
    }

    if (session.uploadedChunks.length < session.totalChunks) {
      throw new BadRequestException(
        `Incomplete chunks. Uploaded: ${session.uploadedChunks.length} of ${session.totalChunks}`
      );
    }

    await prisma.chunkUploadSession.update({
      where: { uploadId },
      data: { status: "COMPLETED" },
    });

    return {
      message: "Chunk upload completed and verified",
      s3Key: session.s3Key,
      videoUrl: this.getPublicUrl(session.s3Key),
    };
  }
}
