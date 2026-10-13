export interface StreamQuality {
  resolution: string;
  bandwidth: number;
  width: number;
  height: number;
  name: string;
}

export const STREAM_QUALITIES: StreamQuality[] = [
  { name: "1080p", resolution: "1920x1080", bandwidth: 6000000, width: 1920, height: 1080 },
  { name: "720p", resolution: "1280x720", bandwidth: 3000000, width: 1280, height: 720 },
  { name: "480p", resolution: "854x480", bandwidth: 1500000, width: 854, height: 480 },
  { name: "360p", resolution: "640x360", bandwidth: 800000, width: 640, height: 360 },
];

export class HlsUtil {
  public static generateMasterPlaylist(videoId: string, baseUrl: string): string {
    const lines = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "",
    ];

    for (const q of STREAM_QUALITIES) {
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.resolution},NAME="${q.name}"`,
        `${baseUrl}/api/videos/${videoId}/stream/${q.name}.m3u8`,
        ""
      );
    }

    return lines.join("\n");
  }

  public static generateVariantPlaylist(
    videoId: string,
    qualityName: string,
    durationInSeconds: number,
    baseUrl: string,
    segmentDuration = 6
  ): string {
    const totalSegments = Math.max(1, Math.ceil(durationInSeconds / segmentDuration));
    const lines = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      `#EXT-X-TARGETDURATION:${segmentDuration}`,
      "#EXT-X-MEDIA-SEQUENCE:0",
      "",
    ];

    for (let i = 0; i < totalSegments; i++) {
      const segTime = i === totalSegments - 1 ? (durationInSeconds % segmentDuration || segmentDuration) : segmentDuration;
      lines.push(`#EXTINF:${segTime.toFixed(3)},`);
      lines.push(`${baseUrl}/api/videos/${videoId}/stream/segments/${qualityName}_segment_${i}.ts`);
    }

    lines.push("#EXT-X-ENDLIST");
    return lines.join("\n");
  }
}
