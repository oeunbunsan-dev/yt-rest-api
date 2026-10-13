import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.config";
import { UnauthorizedException } from "../exceptions/app-errors";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenId?: string;
}

export class JwtUtil {
  public static signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRY as any,
    });
  }

  public static signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRY as any,
    });
  }

  public static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  public static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  public static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}
