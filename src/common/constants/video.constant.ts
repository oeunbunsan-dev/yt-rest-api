export const VIDEO_STATUS = {
  DRAFT: "DRAFT",
  PROCESSING: "PROCESSING",
  PUBLISHED: "PUBLISHED",
  PRIVATE: "PRIVATE",
  DELETED: "DELETED",
} as const;

export const VIDEO_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  UNLISTED: "UNLISTED",
} as const;

export type VideoStatusType = (typeof VIDEO_STATUS)[keyof typeof VIDEO_STATUS];
export type VideoVisibilityType = (typeof VIDEO_VISIBILITY)[keyof typeof VIDEO_VISIBILITY];
