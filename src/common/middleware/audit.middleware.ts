import { prisma } from "../../database/prisma.service";

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  resource: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err) {
      console.warn("Failed to write audit log:", err);
    }
  }
}
