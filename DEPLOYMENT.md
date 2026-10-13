# 🚀 Production Deployment & Operations Guide

## Production-Ready YouTube Clone REST API

This guide provides end-to-end instructions for deploying, scaling, and operating the YouTube Clone REST API built with **ElysiaJS**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, **Redis**, **MinIO**, and **Bun**.

---

## 🏛️ Architecture Overview

The system follows **Clean Architecture**, **Domain-Driven Design (DDD)**, and **SOLID Principles**:

```
                       ┌───────────────────────┐
                       │     Client / App      │
                       └───────────┬───────────┘
                                   │ HTTP / HLS
                                   ▼
                       ┌───────────────────────┐
                       │   Reverse Proxy / API │
                       │    (ElysiaJS / Bun)   │
                       └───────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ PostgreSQL 16 DB │      │   Redis Cache    │      │  MinIO S3 Storage│
│  (Prisma ORM)    │      │  (Rate Limiter)  │      │  (Media Assets)  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

- **Domain Driven Modules**:
  - `auth`: JWT Authentication (Access + Refresh), Token Rotation, Email Verification, RBAC (`ADMIN`, `CREATOR`, `USER`).
  - `users`: User profiles, avatars, and cover images.
  - `channels`: Channel creation, handles (`@channel`), banners, and subscriber metrics.
  - `videos`: Video metadata, statuses (`DRAFT`, `PROCESSING`, `PUBLISHED`, `PRIVATE`, `DELETED`), visibility (`PUBLIC`, `PRIVATE`, `UNLISTED`).
  - `streaming`: HLS Adaptive Bitrate Streaming (`master.m3u8`, quality variants `1080p`, `720p`, `480p`, `360p`) and HTTP Range byte streaming.
  - `comments`: Nested multi-level threaded replies, pinned comments, and like/dislike reactions.
  - `playlists`: Custom playlists with ordered video positions.
  - `subscriptions`: Channel subscription tracking with ACID transaction safety.
  - `likes`: Video likes and favorites.
  - `histories`: Video watch progress and recently watched history.
  - `notifications`: Event-driven notifications (`NEW_SUBSCRIBER`, `NEW_COMMENT`, `NEW_VIDEO`, `MENTION`).
  - `uploads`: MinIO S3 integration for direct uploads, presigned URLs, and multipart chunk uploads.
  - `analytics`: Creator Dashboard (monetization eligibility, watch hours, top videos) & Admin Dashboard (storage metrics, system health).
  - `search`: High-performance multi-criteria search with Postgres query optimization.

---

## 📋 Infrastructure & Port Matrix

| Service | Internal Port | Host Port | Credentials / Notes |
|---|---|---|---|
| **API** | `3000` | `3001` | `http://localhost:3001` (Swagger: `/swagger`) |
| **PostgreSQL** | `5432` | `5433` | `postgres:postgres` / DB: `youtube_clone` |
| **Redis** | `6379` | `6380` | Cache-aside, Rate Limiting |
| **MinIO API** | `9000` | `9000` | S3 API endpoint |
| **MinIO Console**| `9001` | `9001` | Web UI: `minioadmin:minioadmin` |
| **pgAdmin** | `80` | `5050` | `admin@youtubeclone.dev:adminpassword` |

---

## 🛠️ Prerequisites

- **Bun Runtime**: v1.2+ installed (`curl -fsSL https://bun.sh/install | bash`)
- **Docker & Docker Compose**: v2.20+ or Docker Compose v5+
- **OpenSSL**: For Prisma Client engines

---

## 🚀 Quickstart Deployment (Docker Compose)

### 1. Clone & Configure Environment

```bash
git clone <repo-url> yt-rest-api
cd yt-rest-api

# Copy environment template
cp .env.example .env
```

Review `.env` and set strong secrets:
```env
JWT_SECRET=use_a_cryptographically_secure_random_key_64_chars
JWT_REFRESH_SECRET=use_another_cryptographically_secure_key_64_chars
```

### 2. Launch Infrastructure Services

```bash
docker compose up -d postgres redis minio pgadmin
```

Verify service health:
```bash
docker compose ps
```

### 3. Synchronize Database & Generate Prisma Client

```bash
# Push schema migrations to PostgreSQL
bun run prisma:push

# Generate client
bun run prisma:generate

# Populate database with realistic seed data
bun run prisma:seed
```

### 4. Build and Launch API Container

```bash
# Build and run the entire stack including the API
docker compose up -d --build
```

---

## 🧪 Verification & Testing

### 1. Health Check
```bash
curl -i http://localhost:3001/health
```
Expected response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "YouTube Clone REST API is healthy",
  "data": {
    "status": "UP",
    "uptime": 12.4
  }
}
```

### 2. Swagger / OpenAPI Documentation
Open your browser to:
```
http://localhost:3001/swagger
```
Interactive Swagger UI enables testing all Auth, Upload, Streaming, and CRUD operations directly in your browser with JWT Bearer authentication.

### 3. MinIO S3 Console
Open your browser to:
```
http://localhost:9001
```
Login with:
- **Username**: `minioadmin`
- **Password**: `minioadmin`
- **Default Bucket**: `youtube-clone-assets`

### 4. pgAdmin Database Management
Open your browser to:
```
http://localhost:5050
```
Login with:
- **Email**: `admin@youtubeclone.dev`
- **Password**: `adminpassword`
- **Connection Host**: `postgres` (internal docker network) or `localhost:5433`

### 5. Run Test Suite
```bash
bun test
```
All unit tests and integration tests execute against the Elysia HTTP pipeline.

---

## 🔐 Security Best Practices

1. **JWT Secret Rotation**:
   - Store access and refresh tokens in secure environment variables or vault secrets managers (HashiCorp Vault, AWS Secrets Manager).
   - Refresh tokens are hashed and strictly revoked upon logout and rotation.
2. **Rate Limiting**:
   - Redis sliding window rate limits protect public endpoints against brute-force attacks and abuse (default: 100 req / 60s).
3. **Role-Based Access Control (RBAC)**:
   - Built-in roles: `USER`, `CREATOR`, `ADMIN`.
   - Admin routes (`/api/analytics/admin`) are restricted via `requireAdmin` guards.
4. **Input Sanitization**:
   - Strong schema validation powered by Elysia's TypeBox schema validation engine (`t.Object(...)`).
   - Parameterized queries via Prisma ORM completely prevent SQL Injection.
5. **Reverse Proxy (Nginx / Cloudflare)**:
   - Terminate SSL/TLS at reverse proxy level.
   - Forward `X-Forwarded-For` and `Host` headers.

---

## 📦 Video Transcoding & HLS Streaming Pipeline

1. **Chunked Direct Upload**:
   - Large video files are chunked client-side and uploaded using `/api/uploads/chunks/init`, `/api/uploads/chunks/upload`, and `/api/uploads/chunks/complete`.
2. **Adaptive Bitrate Streaming**:
   - Master playlist available at: `/api/videos/:id/stream/master.m3u8`
   - Quality variants: `1080p`, `720p`, `480p`, `360p`.
3. **Range Byte Streaming**:
   - For standard MP4 playback, `/api/videos/:id/stream` provides HTTP 206 Partial Content range streaming.

---

## 🔄 Maintenance & Database Backups

### PostgreSQL Backup:
```bash
docker exec -t yt_postgres pg_dump -U postgres youtube_clone > backup_$(date +%F).sql
```

### PostgreSQL Restore:
```bash
cat backup_2026-10-13.sql | docker exec -i yt_postgres psql -U postgres -d youtube_clone
```

### Redis Persistence:
Redis is configured with Append Only File (`--appendonly yes`) mapped to persistent docker volume `redis_data`.
