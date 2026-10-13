# 🎬 YouTube Clone REST API

An enterprise-grade, production-ready YouTube Clone REST & Video Streaming API built with **ElysiaJS**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, **Redis**, **MinIO S3**, and **Docker** running on the ultra-fast **Bun** runtime.

---

## 🌟 Key Highlights

- ⚡ **High-Throughput Runtime**: Built on Bun with ElysiaJS for maximum performance and sub-millisecond response times.
- 🏛️ **Clean Architecture & DDD**: Clear separation of Concerns (Controllers, Services, Repositories, DTOs, Domain Entities).
- 🔐 **Security & RBAC**: JWT Access & Refresh Token rotation, Password hashing with bcrypt, Role-based access control (`ADMIN`, `CREATOR`, `USER`).
- 📹 **Video Streaming & HLS**: Full support for Adaptive Bitrate Streaming (HLS Master & Variant Playlists: 1080p, 720p, 480p, 360p) + HTTP Range byte-streaming.
- 🗄️ **MinIO S3 Storage**: Object storage for video uploads, chunked resumable uploads, thumbnails, channel banners, and avatars.
- ⚡ **Redis Performance Layer**: Cache-aside caching for trending and popular videos, sliding-window rate limiting.
- 💬 **Interactive Community**: Multi-level threaded replies, pinned comments, likes/dislikes reactions, and subscriber metrics.
- 📊 **Dual Analytics Dashboards**: Creator Studio (views, watch hours, top videos, monetization readiness) and Admin Dashboard (storage metrics, system health).
- 📖 **Interactive Swagger / OpenAPI**: Full OpenAPI 3.0 interactive documentation at `/swagger`.

---

## 📁 Project Structure

```
yt-rest-api/
├── src/
│   ├── config/
│   │   ├── env.config.ts            # Environment variables & runtime options
│   │   ├── redis.config.ts          # Redis client options
│   │   ├── minio.config.ts          # MinIO / S3 client & storage prefixes
│   │   └── database.config.ts       # Database configuration
│   ├── database/
│   │   ├── prisma.service.ts        # Prisma singleton with connection management
│   │   └── redis.service.ts         # Redis cache-aside, counters & rate limiting
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # Bearer JWT derive & requireAuth guard
│   │   │   ├── role.middleware.ts   # RBAC guards (requireRole, requireAdmin)
│   │   │   ├── rate-limiter.middleware.ts # Redis sliding window rate limiter
│   │   │   └── audit.middleware.ts  # Audit log persistence
│   │   ├── plugins/
│   │   │   ├── swagger.plugin.ts    # OpenAPI 3.0 documentation
│   │   │   ├── cors.plugin.ts       # CORS headers configuration
│   │   │   └── error-handler.plugin.ts # Global exception and Prisma error handler
│   │   ├── exceptions/
│   │   │   ├── http.exception.ts    # Base HTTP exception class
│   │   │   └── app-errors.ts        # Specific status errors (400, 401, 403, 404, 409, 422, 429, 500)
│   │   ├── utils/
│   │   │   ├── response.util.ts     # Standardized response format & BigInt sanitizer
│   │   │   ├── password.util.ts     # Bcrypt password hashing
│   │   │   ├── jwt.util.ts          # Token signing and verification
│   │   │   ├── pagination.util.ts   # Cursor & offset pagination
│   │   │   └── hls.util.ts          # Adaptive Bitrate HLS playlist generator
│   │   └── constants/
│   │       ├── roles.constant.ts    # ADMIN, CREATOR, USER
│   │       ├── video.constant.ts    # Status & Visibility enums
│   │       └── http-status.constant.ts
│   ├── modules/
│   │   ├── auth/                    # Registration, login, refresh tokens, verification
│   │   ├── users/                   # Profile management, avatars, cover images
│   │   ├── channels/                # Channels CRUD, @handles, subscriber counts
│   │   ├── videos/                  # Video metadata, publishing, HLS streaming
│   │   ├── comments/                # Nested replies, pinned comments, reactions
│   │   ├── playlists/               # Playlists curation and ordering
│   │   ├── subscriptions/           # Channel subscriptions & notifications
│   │   ├── likes/                   # Video likes and reactions
│   │   ├── histories/               # Watch history and resume progress
│   │   ├── notifications/           # User notifications and read toggles
│   │   ├── uploads/                 # Direct S3, presigned URLs, chunked uploads
│   │   ├── analytics/               # Creator & Admin dashboards
│   │   └── search/                  # Multi-criteria search across all entities
│   ├── app.ts                       # Application orchestrator
│   └── index.ts                     # Lifecycle bootstrap & graceful shutdown
├── prisma/
│   ├── schema.prisma                # PostgreSQL models with relational constraints
│   └── seed.ts                      # Demo seed data (Admin, Creator, Alice, Videos, Playlists)
├── tests/
│   ├── unit/                        # Unit tests for Password, JWT, HLS, and Pagination
│   └── integration/                 # Integration tests for Elysia HTTP routes
├── Dockerfile                       # Multi-stage production container build
├── docker-compose.yml               # PostgreSQL, Redis, MinIO, pgAdmin & API
├── DEPLOYMENT.md                    # Production deployment & operations guide
├── .env.example                     # Environment template
└── package.json
```

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `POST` | `/api/auth/refresh` | Public | Rotate and renew JWT access token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token |
| `POST` | `/api/auth/verify-email` | Public | Verify email address with token |
| `POST` | `/api/auth/forgot-password` | Public | Initiate password reset request |
| `POST` | `/api/auth/reset-password` | Public | Reset password with token |

### 👤 Users (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | Get current user profile and channel |
| `PUT` | `/api/users/profile` | Authenticated | Update user username/email |
| `PUT` | `/api/users/avatar` | Authenticated | Update user avatar URL |
| `PUT` | `/api/users/cover` | Authenticated | Update cover image URL |

### 📺 Channels (`/api/channels`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/channels` | Authenticated | Create a new channel (auto-elevates to CREATOR) |
| `GET` | `/api/channels/me` | Authenticated | Get currently logged-in user channel |
| `GET` | `/api/channels/:id` | Public | Get channel by `@handle` or channel ID |
| `PUT` | `/api/channels/:id` | Owner/Admin | Update channel details |
| `DELETE` | `/api/channels/:id` | Owner/Admin | Delete channel |
| `GET` | `/api/channels/:id/videos` | Public | Get videos published by channel |
| `POST` | `/api/channels/:id/subscribe` | Authenticated | Subscribe to channel |
| `DELETE`| `/api/channels/:id/subscribe` | Authenticated | Unsubscribe from channel |
| `GET` | `/api/channels/:id/subscribers/count` | Public | Get subscriber count |

### 🎥 Videos & Streaming (`/api/videos`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/videos` | Creator/Admin | Publish a new video |
| `GET` | `/api/videos` | Public | Search/filter videos (pagination, tags, categories) |
| `GET` | `/api/videos/trending` | Public | Trending videos (cached in Redis) |
| `GET` | `/api/videos/popular` | Public | Most viewed videos |
| `GET` | `/api/videos/recommendations` | Public/Auth | Video recommendations |
| `GET` | `/api/videos/:id` | Public | Get video details (increments views) |
| `GET` | `/api/videos/:id/related` | Public | Get related videos by category & tags |
| `POST` | `/api/videos/:id/views` | Public | Increment video view count |
| `PUT` | `/api/videos/:id` | Owner/Admin | Update video metadata |
| `DELETE`| `/api/videos/:id` | Owner/Admin | Delete video |
| `GET` | `/api/videos/:id/stream/master.m3u8` | Public | HLS Master Playlist (Adaptive Bitrate) |
| `GET` | `/api/videos/:id/stream/:quality.m3u8`| Public | HLS Variant Playlist (1080p, 720p, etc.) |
| `GET` | `/api/videos/:id/stream` | Public | HTTP Range byte-stream video |

### 💬 Comments & Reactions (`/api/videos/:id/comments` & `/api/comments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/videos/:id/comments` | Authenticated | Post comment or reply (with `parentId`) |
| `GET` | `/api/videos/:id/comments` | Public | Get video comments and replies |
| `PUT` | `/api/comments/:id` | Author/Admin | Edit comment |
| `DELETE`| `/api/comments/:id` | Author/Owner/Admin | Delete comment |
| `PATCH` | `/api/comments/:id/pin` | Owner/Admin | Pin / Unpin comment |
| `POST` | `/api/comments/:id/like` | Authenticated | Like comment |
| `POST` | `/api/comments/:id/dislike` | Authenticated | Dislike comment |
| `DELETE`| `/api/comments/:id/reaction` | Authenticated | Remove comment reaction |

### 📂 Playlists (`/api/playlists`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/playlists` | Authenticated | Create a new playlist |
| `GET` | `/api/playlists` | Public | List playlists (or filter `?mine=true`) |
| `GET` | `/api/playlists/:id` | Public | Get playlist with video list |
| `PUT` | `/api/playlists/:id` | Owner/Admin | Update playlist |
| `DELETE`| `/api/playlists/:id` | Owner/Admin | Delete playlist |
| `POST` | `/api/playlists/:id/videos` | Owner/Admin | Add video to playlist |
| `DELETE`| `/api/playlists/:id/videos/:videoId` | Owner/Admin | Remove video from playlist |

### 👍 Likes (`/api/videos/:id/like` & `/api/videos/liked`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/videos/:id/like` | Authenticated | Like video |
| `DELETE`| `/api/videos/:id/like` | Authenticated | Remove like |
| `GET` | `/api/videos/liked` | Authenticated | Get current user liked videos |

### 🕒 Watch History (`/api/histories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/histories/videos/:id` | Authenticated | Record watch duration |
| `GET` | `/api/histories` | Authenticated | Get watch history |
| `DELETE`| `/api/histories/:id` | Authenticated | Remove history item |
| `DELETE`| `/api/histories/clear` | Authenticated | Clear watch history |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Get notifications & unread count |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

### 📤 Uploads (`/api/uploads`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/uploads/video` | Authenticated | Direct multipart video upload |
| `POST` | `/api/uploads/thumbnail` | Authenticated | Upload thumbnail image |
| `POST` | `/api/uploads/avatar` | Authenticated | Upload user or channel avatar |
| `POST` | `/api/uploads/banner` | Authenticated | Upload channel banner |
| `POST` | `/api/uploads/presigned-url` | Authenticated | Generate S3 presigned upload URL |
| `POST` | `/api/uploads/chunks/init` | Authenticated | Initialize chunked upload session |
| `POST` | `/api/uploads/chunks/upload` | Authenticated | Upload individual binary chunk |
| `POST` | `/api/uploads/chunks/complete` | Authenticated | Finalize and verify chunked upload |

### 📈 Analytics (`/api/analytics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/creator` | Authenticated | Creator dashboard (views, subscribers, watch hours, top videos) |
| `GET` | `/api/analytics/admin` | Admin Only | Platform admin metrics & storage stats |

### 🔍 Search (`/api/search`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/search?q=...&type=all` | Public | Multi-criteria search across videos, channels, playlists |

---

## 🚀 Quick Start Guide

### 1. Start Docker Services
```bash
docker compose up -d postgres redis minio pgadmin
```

### 2. Run Database Migrations & Seeds
```bash
bun run prisma:push
bun run prisma:generate
bun run prisma:seed
```

### 3. Start Development Server
```bash
bun run dev
```

The server will be available at:
- **API**: [http://localhost:3000](http://localhost:3000)
- **Swagger Documentation**: [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 👥 Seed User Accounts

| Role | Email | Password | Handle |
|---|---|---|---|
| **ADMIN** | `admin@youtubeclone.dev` | `Password123!` | - |
| **CREATOR**| `creator@youtubeclone.dev` | `Password123!` | `@techcraft` |
| **USER** | `alice@youtubeclone.dev` | `Password123!` | `@alicedev` |

---

## 🧪 Testing

Run the test suite with Bun:
```bash
bun test
```
Outputs:
- 14 automated tests covering Password hashing, JWT token rotation, HLS playlist generation, Pagination boundary parsing, and Elysia HTTP route pipeline validation.

---

## 📄 License
MIT
