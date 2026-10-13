import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with production-grade YouTube demo data...");

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.videoHistory.deleteMany();
  await prisma.like.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.playlistVideo.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.video.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.chunkUploadSession.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      username: "superadmin",
      email: "admin@youtubeclone.dev",
      password: passwordHash,
      role: "ADMIN",
      verified: true,
      avatar: "http://localhost:9000/youtube-clone-assets/avatars/admin.png",
      coverImage: "http://localhost:9000/youtube-clone-assets/banners/admin_banner.png",
    },
  });

  // 2. Create Creator & Channel
  const creator = await prisma.user.create({
    data: {
      username: "techcraft",
      email: "creator@youtubeclone.dev",
      password: passwordHash,
      role: "CREATOR",
      verified: true,
      avatar: "http://localhost:9000/youtube-clone-assets/avatars/techcraft.png",
      channel: {
        create: {
          name: "TechCraft Official",
          handle: "techcraft",
          description: "High-performance systems programming, Bun, TypeScript, and modern distributed architectures.",
          avatar: "http://localhost:9000/youtube-clone-assets/avatars/techcraft_ch.png",
          banner: "http://localhost:9000/youtube-clone-assets/banners/techcraft_banner.png",
          subscribersCount: 1250,
        },
      },
    },
    include: { channel: true },
  });

  // 3. Create Regular User & Channel
  const user = await prisma.user.create({
    data: {
      username: "alice_dev",
      email: "alice@youtubeclone.dev",
      password: passwordHash,
      role: "USER",
      verified: true,
      avatar: "http://localhost:9000/youtube-clone-assets/avatars/alice.png",
      channel: {
        create: {
          name: "Alice in Devland",
          handle: "alicedev",
          description: "Exploring web performance, full-stack tools, and developer lifestyles.",
          avatar: "http://localhost:9000/youtube-clone-assets/avatars/alice_ch.png",
          subscribersCount: 340,
        },
      },
    },
    include: { channel: true },
  });

  // 4. Create Videos for Creator
  const video1 = await prisma.video.create({
    data: {
      channelId: creator.channel!.id,
      title: "Building Microservices with ElysiaJS and Bun in 2026",
      description: "Learn how to build lightning-fast REST and Streaming APIs with Bun, Elysia, PostgreSQL, and MinIO S3.",
      thumbnail: "http://localhost:9000/youtube-clone-assets/thumbnails/video1.jpg",
      videoUrl: "http://localhost:9000/youtube-clone-assets/videos/video1.mp4",
      hlsMasterUrl: "http://localhost:3000/api/videos/STREAM/master.m3u8",
      duration: 1240.5,
      visibility: "PUBLIC",
      status: "PUBLISHED",
      category: "Technology",
      tags: ["bun", "elysia", "typescript", "docker"],
      views: BigInt(5420),
    },
  });

  const video2 = await prisma.video.create({
    data: {
      channelId: creator.channel!.id,
      title: "Zero-Latency HLS Video Streaming Deep Dive",
      description: "Everything you need to know about adaptive bitrate streaming and MPEG-TS chunk distribution.",
      thumbnail: "http://localhost:9000/youtube-clone-assets/thumbnails/video2.jpg",
      videoUrl: "http://localhost:9000/youtube-clone-assets/videos/video2.mp4",
      hlsMasterUrl: "http://localhost:3000/api/videos/STREAM/master.m3u8",
      duration: 890.0,
      visibility: "PUBLIC",
      status: "PUBLISHED",
      category: "Technology",
      tags: ["streaming", "hls", "minio", "video"],
      views: BigInt(12890),
    },
  });

  const video3 = await prisma.video.create({
    data: {
      channelId: user.channel!.id,
      title: "A Day in the Life of a Remote Software Engineer",
      description: "Coffee, code, architecture design sessions, and clean code principles.",
      thumbnail: "http://localhost:9000/youtube-clone-assets/thumbnails/video3.jpg",
      videoUrl: "http://localhost:9000/youtube-clone-assets/videos/video3.mp4",
      hlsMasterUrl: "http://localhost:3000/api/videos/STREAM/master.m3u8",
      duration: 654.2,
      visibility: "PUBLIC",
      status: "PUBLISHED",
      category: "Vlog",
      tags: ["coding", "lifestyle", "productivity"],
      views: BigInt(3100),
    },
  });

  // 5. Create Comments & Nested Reply
  const topComment = await prisma.comment.create({
    data: {
      videoId: video1.id,
      userId: user.id,
      content: "This ElysiaJS tutorial is fantastic! The throughput on Bun is incredible.",
      isPinned: true,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: video1.id,
      userId: creator.id,
      parentId: topComment.id,
      content: "Thank you Alice! Glad you found the streaming architecture useful.",
    },
  });

  // 6. Create Reactions
  await prisma.commentReaction.create({
    data: {
      commentId: topComment.id,
      userId: creator.id,
      type: "LIKE",
    },
  });

  // 7. Create Video Likes
  await prisma.like.create({
    data: {
      userId: user.id,
      videoId: video1.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: user.id,
      videoId: video2.id,
    },
  });

  // 8. Create Subscriptions
  await prisma.subscription.create({
    data: {
      subscriberId: user.id,
      channelId: creator.channel!.id,
    },
  });

  // 9. Create Playlist & Playlist Videos
  const playlist = await prisma.playlist.create({
    data: {
      userId: user.id,
      title: "Full-Stack Distributed Systems Masterclass",
      description: "Top recommended videos to master high-performance backend development.",
      visibility: "PUBLIC",
      videos: {
        create: [
          { videoId: video1.id, position: 0 },
          { videoId: video2.id, position: 1 },
        ],
      },
    },
  });

  // 10. Create Watch History
  await prisma.videoHistory.create({
    data: {
      userId: user.id,
      videoId: video1.id,
      watchedDuration: 620,
    },
  });

  // 11. Create Notifications
  await prisma.notification.create({
    data: {
      userId: creator.id,
      title: "New Subscriber!",
      content: "alice_dev just subscribed to TechCraft Official.",
      type: "NEW_SUBSCRIBER",
      read: false,
    },
  });

  console.log("Seeding completed successfully!");
  console.log(`- Admin:   ${admin.email} (Password: Password123!)`);
  console.log(`- Creator: ${creator.email} (Password: Password123!)`);
  console.log(`- User:    ${user.email} (Password: Password123!)`);
  console.log(`- Videos created: ${video1.title}, ${video2.title}, ${video3.title}`);
  console.log(`- Playlist: ${playlist.title}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
