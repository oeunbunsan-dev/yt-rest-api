import { describe, expect, it } from "bun:test";
import { HlsUtil } from "../../src/common/utils/hls.util";

describe("HlsUtil Unit Tests", () => {
  it("should generate a standard HLS master playlist with quality streams", () => {
    const videoId = "video-test-123";
    const baseUrl = "http://localhost:3000";
    const master = HlsUtil.generateMasterPlaylist(videoId, baseUrl);

    expect(master).toContain("#EXTM3U");
    expect(master).toContain("#EXT-X-VERSION:3");
    expect(master).toContain("1080p.m3u8");
    expect(master).toContain("720p.m3u8");
    expect(master).toContain("480p.m3u8");
    expect(master).toContain("360p.m3u8");
  });

  it("should generate a variant playlist with chunk segment durations", () => {
    const videoId = "video-test-123";
    const variant = HlsUtil.generateVariantPlaylist(videoId, "720p", 60, "http://localhost:3000", 6);

    expect(variant).toContain("#EXTM3U");
    expect(variant).toContain("#EXT-X-TARGETDURATION:6");
    expect(variant).toContain("#EXTINF:6.000,");
    expect(variant).toContain("720p_segment_0.ts");
    expect(variant).toContain("#EXT-X-ENDLIST");
  });
});
