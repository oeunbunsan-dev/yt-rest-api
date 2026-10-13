import { Elysia } from "elysia";
import { JwtUtil, type TokenPayload } from "../utils/jwt.util";
import { UnauthorizedException } from "../exceptions/app-errors";

export const authPlugin = new Elysia({ name: "auth-middleware" })
  .as("global")
  .derive({ as: "global" }, ({ headers }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        currentUser: null as TokenPayload | null,
      };
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return {
        currentUser: null as TokenPayload | null,
      };
    }

    try {
      const payload = JwtUtil.verifyAccessToken(token);
      return {
        currentUser: payload,
      };
    } catch {
      return {
        currentUser: null as TokenPayload | null,
      };
    }
  });

export function requireAuth(user: TokenPayload | null): TokenPayload {
  if (!user) {
    throw new UnauthorizedException("Authentication required. Please provide a valid Bearer token.");
  }
  return user;
}
