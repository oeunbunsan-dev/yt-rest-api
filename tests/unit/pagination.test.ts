import { describe, expect, it } from "bun:test";
import { PaginationUtil } from "../../src/common/utils/pagination.util";

describe("PaginationUtil Unit Tests", () => {
  it("should calculate correct offset and default limits", () => {
    const parsed = PaginationUtil.parsePagination({ page: "3", limit: "15" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(15);
    expect(parsed.skip).toBe(30);
  });

  it("should enforce sensible boundaries on pagination", () => {
    const parsed = PaginationUtil.parsePagination({ page: "-5", limit: "500" });
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(100); // Max limit is capped at 100
  });

  it("should construct metadata with correct page counts and navigation flags", () => {
    const meta = PaginationUtil.buildMeta(95, 2, 10);
    expect(meta.total).toBe(95);
    expect(meta.totalPages).toBe(10);
    expect(meta.hasNextPage).toBeTrue();
    expect(meta.hasPrevPage).toBeTrue();
  });
});
