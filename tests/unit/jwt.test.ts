import { describe, expect, it } from "bun:test";
import { JwtUtil } from "../../src/common/utils/jwt.util";

describe("JwtUtil Unit Tests", () => {
  const samplePayload = {
    userId: "user-uuid-1234",
    email: "test@youtubeclone.dev",
    role: "CREATOR",
  };

  it("should sign and verify valid access token", () => {
    const token = JwtUtil.signAccessToken(samplePayload);
    expect(token).toBeString();

    const decoded = JwtUtil.verifyAccessToken(token);
    expect(decoded.userId).toBe(samplePayload.userId);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.role).toBe(samplePayload.role);
  });

  it("should sign and verify valid refresh token", () => {
    const token = JwtUtil.signRefreshToken(samplePayload);
    expect(token).toBeString();

    const decoded = JwtUtil.verifyRefreshToken(token);
    expect(decoded.userId).toBe(samplePayload.userId);
  });

  it("should throw unauthorized error when token is invalid", () => {
    expect(() => {
      JwtUtil.verifyAccessToken("invalid-corrupted-token");
    }).toThrow();
  });
});
