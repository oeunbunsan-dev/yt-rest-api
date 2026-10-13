export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  cursor?: string | null;
}

export class PaginationUtil {
  public static parsePagination(query?: PaginationQuery): {
    page: number;
    limit: number;
    skip: number;
    cursor?: string;
  } {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const cursor = typeof query?.cursor === "string" ? query.cursor : undefined;

    return { page, limit, skip, cursor };
  }

  public static buildMeta(total: number, page: number, limit: number, cursor?: string | null): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      cursor,
    };
  }
}
