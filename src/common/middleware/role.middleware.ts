import type { TokenPayload } from "../utils/jwt.util";
import { ForbiddenException, UnauthorizedException } from "../exceptions/app-errors";
import { USER_ROLES, type UserRole } from "../constants/roles.constant";

export function requireRole(user: TokenPayload | null, allowedRoles: (UserRole | string)[]): TokenPayload {
  if (!user) {
    throw new UnauthorizedException("Authentication required.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenException(
      `Access denied. Role '${user.role}' does not have sufficient permissions. Required: ${allowedRoles.join(", ")}`
    );
  }

  return user;
}

export function requireAdmin(user: TokenPayload | null): TokenPayload {
  return requireRole(user, [USER_ROLES.ADMIN]);
}

export function requireCreatorOrAdmin(user: TokenPayload | null): TokenPayload {
  return requireRole(user, [USER_ROLES.CREATOR, USER_ROLES.ADMIN]);
}
