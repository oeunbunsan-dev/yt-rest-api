import { describe, expect, it } from "bun:test";
import { app } from "../../src/app";

describe("API Integration Tests (Elysia HTTP Pipeline)", () => {
  it("GET /health should return 200 with UP status", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBeTrue();
    expect(json.data.status).toBe("UP");
  });

  it("POST /api/auth/register should reject invalid inputs with 422", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "a", // too short (min 3)
          email: "not-an-email",
          password: "123", // too short (min 6)
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("POST /api/videos should reject unauthorized requests without token with 401", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Unauthorized Video Upload",
          videoUrl: "http://example.com/video.mp4",
        }),
      })
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBeFalse();
  });

  it("GET /swagger/json should serve valid OpenAPI schema", async () => {
    const res = await app.handle(new Request("http://localhost/swagger/json"));
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.openapi || spec.swagger).toBeDefined();
    expect(spec.info.title).toContain("YouTube Clone");
  });
});
